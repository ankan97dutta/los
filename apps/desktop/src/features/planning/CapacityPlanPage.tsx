import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { CommitmentKind, TeamMember, WorkStatus } from '@los/domain';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime };

type PeriodView = Awaited<ReturnType<typeof api.planningPeriodGet>>;
type PeriodOk = Extract<PeriodView, { ok: true }>['data'];

export function CapacityPlanPage({ rt }: Props) {
  const [data, setData] = useState<PeriodOk | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workEstimate, setWorkEstimate] = useState('4');
  const [workUnknown, setWorkUnknown] = useState(false);
  const [tradeoff, setTradeoff] = useState('');
  const [carryIds, setCarryIds] = useState<string[]>([]);
  const [historyPayload, setHistoryPayload] = useState<string | null>(null);

  const load = useCallback(
    async (periodStart?: string) => {
      const [p, m] = await Promise.all([
        api.planningPeriodGet(rt, periodStart),
        api.planningMembersList(rt),
      ]);
      if (!p.ok) {
        setError(p.error.message);
        return;
      }
      if (m.ok) setMembers(m.data.members);
      setData(p.data);
      setTradeoff(p.data.period.tradeoffNotes);
      setError(null);
      setHistoryPayload(null);
      if (p.data.period.status === 'closed') {
        const h = await api.planningHistoryGet(rt, p.data.period.periodStart);
        if (h.ok && h.data.snapshot) setHistoryPayload(h.data.snapshot.payload);
      }
    },
    [rt],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <p className="muted">Loading capacity plan…</p>;

  const closed = data.period.status === 'closed';
  const allocByWork = new Map(data.allocations.map((a) => [a.workItemId, a]));

  async function addMember() {
    const r = await api.planningMemberUpsert(rt, { displayName: newMember });
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setNewMember('');
    await api.planningCapacityUpsert(rt, {
      periodStart: data!.period.periodStart,
      teamMemberId: r.data.member.id,
      availableHours: 40,
      leaveHours: 0,
      reservedCommitmentHours: 0,
      unplannedBufferHours: 4,
    });
    await load(data!.period.periodStart);
  }

  async function saveCapacity(
    teamMemberId: string,
    patch: {
      availableHours: number;
      leaveHours: number;
      reservedCommitmentHours: number;
      unplannedBufferHours: number;
    },
  ) {
    const r = await api.planningCapacityUpsert(rt, {
      periodStart: data!.period.periodStart,
      teamMemberId,
      ...patch,
    });
    if (!r.ok) setError(r.error.message);
    else await load(data!.period.periodStart);
  }

  async function addWork() {
    const r = await api.planningWorkUpsert(rt, {
      periodStart: data!.period.periodStart,
      title: workTitle,
      estimateHours: workUnknown ? null : Number(workEstimate),
      estimateUnknown: workUnknown,
      status: 'ready',
    });
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setWorkTitle('');
    await load(data!.period.periodStart);
  }

  async function allocate(
    workItemId: string,
    teamMemberId: string | null,
    commitmentKind: CommitmentKind,
  ) {
    if (commitmentKind === 'commitment' && !teamMemberId) {
      setError('Commitment requires an assigned team member.');
      return;
    }
    const previewConflicted =
      commitmentKind === 'commitment' ||
      data!.warnings.length > 0 ||
      data!.period.planConflicted;
    if (previewConflicted && commitmentKind === 'commitment') {
      const okConfirm = window.confirm(
        'This may leave the plan conflicted (overload / blocked / unestimated). Continue?',
      );
      if (!okConfirm) return;
    }
    const r = await api.planningAllocate(rt, { workItemId, teamMemberId, commitmentKind });
    if (!r.ok) setError(r.error.message);
    else {
      if (r.data.planConflicted) {
        setError('Plan is conflicted (not clean). Warnings remain visible.');
      }
      await load(data!.period.periodStart);
    }
  }

  async function saveNotes() {
    const r = await api.planningPeriodSaveMeta(rt, {
      periodStart: data!.period.periodStart,
      tradeoffNotes: tradeoff,
    });
    if (!r.ok) setError(r.error.message);
    else await load(data!.period.periodStart);
  }

  async function closePeriod() {
    const acceptWarnings =
      data!.period.planConflicted || data!.warnings.length > 0
        ? window.confirm('Close with remaining warnings? Plan stays marked conflicted in history.')
        : false;
    if ((data!.period.planConflicted || data!.warnings.length > 0) && !acceptWarnings) return;
    const r = await api.planningPeriodClose(rt, {
      periodStart: data!.period.periodStart,
      acceptWarnings: data!.warnings.length > 0 ? true : undefined,
      carryForwardWorkItemIds: carryIds,
      carryoverNotes: tradeoff,
    });
    if (!r.ok) setError(r.error.message);
    else await load(data!.period.periodStart);
  }

  return (
    <section className="stack">
      <h1>Capacity planning</h1>
      <p className="lede">
        Team capacity, demand, and commitments for the fortnight. Offline · no Jira/LLM required.
      </p>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            const prev = api.previousFortnight({
              periodStart: data.period.periodStart,
              periodEnd: data.period.periodEnd,
            });
            void load(prev.periodStart);
          }}
        >
          Previous
        </button>
        <strong>
          {data.period.periodStart} → {data.period.periodEnd} · {data.period.status}
          {data.period.planConflicted ? ' · conflicted' : ''}
        </strong>
        <button
          type="button"
          onClick={() => {
            const next = api.nextFortnight({
              periodStart: data.period.periodStart,
              periodEnd: data.period.periodEnd,
            });
            void load(next.periodStart);
          }}
        >
          Next
        </button>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {data.warnings.length > 0 ? (
        <ul className="error" aria-live="polite">
          {data.warnings.map((w, i) => (
            <li key={`${w.code}-${i}`}>{w.message}</li>
          ))}
        </ul>
      ) : null}

      <h2>Team capacity</h2>
      {!closed ? (
        <div className="row">
          <label>
            New member{' '}
            <input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addMember();
              }}
            />
          </label>
          <button type="button" className="primary" onClick={() => void addMember()}>
            Add member
          </button>
        </div>
      ) : null}
      <table className="table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Available</th>
            <th>Leave</th>
            <th>Reserved</th>
            <th>Buffer</th>
            <th>Net</th>
            <th>Load</th>
            <th>Remain</th>
          </tr>
        </thead>
        <tbody>
          {data.capacitySummary.members.map((m) => (
            <tr key={m.teamMemberId}>
              <td>{m.displayName}</td>
              {(
                [
                  'availableHours',
                  'leaveHours',
                  'reservedCommitmentHours',
                  'unplannedBufferHours',
                ] as const
              ).map((field) => (
                <td key={field}>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    disabled={closed}
                    defaultValue={m[field]}
                    aria-label={`${m.displayName} ${field}`}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      void saveCapacity(m.teamMemberId, {
                        availableHours: field === 'availableHours' ? v : m.availableHours,
                        leaveHours: field === 'leaveHours' ? v : m.leaveHours,
                        reservedCommitmentHours:
                          field === 'reservedCommitmentHours' ? v : m.reservedCommitmentHours,
                        unplannedBufferHours:
                          field === 'unplannedBufferHours' ? v : m.unplannedBufferHours,
                      });
                    }}
                  />
                </td>
              ))}
              <td>{m.netHours}</td>
              <td>{m.committedLoadHours}</td>
              <td>{m.remainingHours}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Demand</h2>
      {!closed ? (
        <div className="row">
          <label>
            Title{' '}
            <input
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addWork();
              }}
            />
          </label>
          <label>
            Hours{' '}
            <input
              type="number"
              step={0.5}
              min={0}
              disabled={workUnknown}
              value={workEstimate}
              onChange={(e) => setWorkEstimate(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={workUnknown}
              onChange={(e) => setWorkUnknown(e.target.checked)}
            />{' '}
            Unknown estimate
          </label>
          <button type="button" className="primary" onClick={() => void addWork()}>
            Add work
          </button>
        </div>
      ) : null}
      <ul className="stack">
        {data.work.map((w) => {
          const a = allocByWork.get(w.id);
          return (
            <li key={w.id} className="card">
              <strong>
                {w.title}{' '}
                <span className="muted">
                  ({w.status}
                  {w.estimateUnknown ? '; unestimated' : `; ${w.estimateHours}h`})
                  {a?.commitmentKind === 'stretch' ? ' · stretch' : ''}
                  {a?.commitmentKind === 'commitment' ? ' · commitment' : ''}
                </span>
              </strong>
              {!closed ? (
                <div className="row">
                  <label>
                    Assignee{' '}
                    <select
                      value={a?.teamMemberId ?? ''}
                      onChange={(e) => {
                        const id = e.target.value || null;
                        void allocate(w.id, id, a?.commitmentKind ?? 'none');
                      }}
                    >
                      <option value="">Unallocated</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Kind{' '}
                    <select
                      value={a?.commitmentKind ?? 'none'}
                      onChange={(e) => {
                        const kind = e.target.value as CommitmentKind;
                        void allocate(w.id, a?.teamMemberId ?? null, kind);
                      }}
                    >
                      <option value="none">None</option>
                      <option value="commitment">Commitment</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </label>
                  <label>
                    Status{' '}
                    <select
                      value={w.status}
                      onChange={async (e) => {
                        const status = e.target.value as WorkStatus;
                        const r = await api.planningWorkUpsert(rt, {
                          id: w.id,
                          periodStart: w.periodStart,
                          title: w.title,
                          estimateHours: w.estimateHours,
                          estimateUnknown: w.estimateUnknown,
                          status,
                        });
                        if (!r.ok) setError(r.error.message);
                        else await load(data.period.periodStart);
                      }}
                    >
                      <option value="ready">ready</option>
                      <option value="blocked">blocked</option>
                      <option value="waiting_external">waiting_external</option>
                      <option value="done">done</option>
                      <option value="dropped">dropped</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2>Trade-offs / close</h2>
      <label>
        Notes{' '}
        <textarea
          rows={3}
          value={tradeoff}
          onChange={(e) => setTradeoff(e.target.value)}
          style={{ width: '100%' }}
        />
      </label>
      <div className="row">
        <button type="button" onClick={() => void saveNotes()}>
          Save notes
        </button>
        {!closed ? (
          <button type="button" className="primary" onClick={() => void closePeriod()}>
            Close period
          </button>
        ) : null}
      </div>
      {!closed ? (
        <fieldset>
          <legend>Carry forward (incomplete commitments)</legend>
          {data.work
            .filter((w) => {
              const a = allocByWork.get(w.id);
              return (
                a?.commitmentKind === 'commitment' && w.status !== 'done' && w.status !== 'dropped'
              );
            })
            .map((w) => (
              <label key={w.id} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={carryIds.includes(w.id)}
                  onChange={(e) => {
                    setCarryIds((prev) =>
                      e.target.checked ? [...prev, w.id] : prev.filter((x) => x !== w.id),
                    );
                  }}
                />{' '}
                {w.title}
              </label>
            ))}
        </fieldset>
      ) : null}
      {historyPayload ? (
        <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          Snapshot: {historyPayload}
        </pre>
      ) : null}
    </section>
  );
}
