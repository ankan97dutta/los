import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application, CommitmentKind, TeamMember, WorkPriority, WorkStatus } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { SaveIndicator, type SaveStatus } from '../../ui/SaveIndicator';
import { Select } from '../../ui/Select';
import { StatusCue } from '../../ui/StatusCue';
import {
  actualLabel, commitmentLabel, estimateLabel, formatHours, isBlockedStatus,
  workloadLabel, workloadPercent, workloadState,
} from './planningView';

type Props = { rt: WorkspaceRuntime };
type PeriodView = Awaited<ReturnType<typeof api.planningPeriodGet>>;
type PeriodOk = Extract<PeriodView, { ok: true }>['data'];
type WorkItem = PeriodOk['work'][number];

const PRIORITIES: WorkPriority[] = ['p0', 'p1', 'p2', 'p3'];
const STATUSES: WorkStatus[] = ['ready', 'blocked', 'waiting_external', 'done', 'dropped'];

export function CapacityPlanPage({ rt }: Props) {
  const [data, setData] = useState<PeriodOk | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workEstimate, setWorkEstimate] = useState('4');
  const [workUnknown, setWorkUnknown] = useState(false);
  const [workPriority, setWorkPriority] = useState<WorkPriority>('p2');
  const [workApp, setWorkApp] = useState('');
  const [tradeoff, setTradeoff] = useState('');
  const [outcome, setOutcome] = useState('');
  const [carryover, setCarryover] = useState('');
  const [carryIds, setCarryIds] = useState<string[]>([]);
  const [historyPayload, setHistoryPayload] = useState<string | null>(null);
  const [notesSave, setNotesSave] = useState<SaveStatus>('idle');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showCloseReview, setShowCloseReview] = useState(false);
  const [ackWarnings, setAckWarnings] = useState(false);
  const [detailSave, setDetailSave] = useState<SaveStatus>('idle');
  const [pendingAck, setPendingAck] = useState(false);
  const [draft, setDraft] = useState<{
    title: string; priority: WorkPriority; estimate: string; unknown: boolean;
    actual: string; applicationId: string; dependencyNotes: string;
    status: WorkStatus; assignee: string; kind: CommitmentKind;
  } | null>(null);

  const load = useCallback(async (periodStart?: string) => {
    const [p, m, a] = await Promise.all([
      api.planningPeriodGet(rt, periodStart), api.planningMembersList(rt), api.applicationsList(rt),
    ]);
    if (!p.ok) { setError(p.error.message); return; }
    if (m.ok) setMembers(m.data.members);
    if (a.ok) setApps(a.data.applications);
    setData(p.data);
    setTradeoff(p.data.period.tradeoffNotes);
    setOutcome(p.data.period.outcomeSummary);
    setCarryover(p.data.period.carryoverNotes);
    setError(null); setHistoryPayload(null); setShowCloseReview(false); setAckWarnings(false);
    if (p.data.period.status === 'closed') {
      const h = await api.planningHistoryGet(rt, p.data.period.periodStart);
      if (h.ok && h.data.snapshot) setHistoryPayload(h.data.snapshot.payload);
    }
  }, [rt]);

  useEffect(() => { void load(); }, [load]);

  const allocByWork = useMemo(
    () => new Map((data?.allocations ?? []).map((a) => [a.workItemId, a])),
    [data],
  );
  const selectedWork: WorkItem | null = useMemo(
    () => data?.work.find((w) => w.id === selectedWorkId) ?? null,
    [data, selectedWorkId],
  );

  // Sync the detail draft when selection changes (not on every reload of same item).
  useEffect(() => {
    if (!selectedWork) { setDraft(null); return; }
    const a = allocByWork.get(selectedWork.id);
    setDraft({
      title: selectedWork.title, priority: selectedWork.priority,
      estimate: selectedWork.estimateHours != null ? String(selectedWork.estimateHours) : '',
      unknown: selectedWork.estimateUnknown,
      actual: selectedWork.actualHours != null ? String(selectedWork.actualHours) : '',
      applicationId: selectedWork.applicationId ?? '',
      dependencyNotes: selectedWork.dependencyNotes, status: selectedWork.status,
      assignee: a?.teamMemberId ?? '', kind: a?.commitmentKind ?? 'none',
    });
    setDetailSave('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkId]);

  if (!data) return <p className="muted">Loading capacity plan…</p>;

  const closed = data.period.status === 'closed';
  const totals = data.capacitySummary.totals;
  const appName = (id: string | null) => apps.find((a) => a.id === id)?.name ?? 'Unassigned';
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.displayName ?? 'Unallocated';
  const incompleteCommitments = data.work.filter((w) => {
    const a = allocByWork.get(w.id);
    return a?.commitmentKind === 'commitment' && w.status !== 'done' && w.status !== 'dropped';
  });
  const doneCommitments = data.work.filter((w) => allocByWork.get(w.id)?.commitmentKind === 'commitment' && w.status === 'done');

  async function addMember() {
    const r = await api.planningMemberUpsert(rt, { displayName: newMember });
    if (!r.ok) { setError(r.error.message); return; }
    setNewMember('');
    await api.planningCapacityUpsert(rt, {
      periodStart: data!.period.periodStart, teamMemberId: r.data.member.id,
      availableHours: 40, leaveHours: 0, reservedCommitmentHours: 0, unplannedBufferHours: 4,
    });
    await load(data!.period.periodStart);
  }

  async function saveCapacity(teamMemberId: string, patch: { availableHours: number; leaveHours: number; reservedCommitmentHours: number; unplannedBufferHours: number }) {
    const r = await api.planningCapacityUpsert(rt, { periodStart: data!.period.periodStart, teamMemberId, ...patch });
    if (!r.ok) setError(r.error.message); else await load(data!.period.periodStart);
  }

  async function addWork() {
    const r = await api.planningWorkUpsert(rt, {
      periodStart: data!.period.periodStart, title: workTitle,
      priority: workPriority, applicationId: workApp || null,
      estimateHours: workUnknown ? null : Number(workEstimate),
      estimateUnknown: workUnknown, status: 'ready',
    });
    if (!r.ok) { setError(r.error.message); return; }
    setWorkTitle(''); setSelectedWorkId(r.data.item.id);
    await load(data!.period.periodStart); setSelectedWorkId(r.data.item.id);
  }

  async function saveDetail(acknowledged = false) {
    if (!selectedWork || !draft) return;
    setDetailSave('pending'); setError(null);
    const r = await api.planningWorkUpsert(rt, {
      id: selectedWork.id, periodStart: selectedWork.periodStart, title: draft.title,
      priority: draft.priority,
      estimateHours: draft.unknown ? null : Number(draft.estimate),
      estimateUnknown: draft.unknown,
      actualHours: draft.actual.trim() === '' ? null : Number(draft.actual),
      applicationId: draft.applicationId || null,
      dependencyNotes: draft.dependencyNotes, status: draft.status,
    });
    if (!r.ok) { setDetailSave('failed'); setError(r.error.message); return; }
    const current = allocByWork.get(selectedWork.id);
    if ((current?.teamMemberId ?? '') !== draft.assignee || (current?.commitmentKind ?? 'none') !== draft.kind) {
      if (draft.kind === 'commitment' && !draft.assignee) {
        setDetailSave('failed'); setError('Commitment requires an assigned team member. Assign first, then mark Committed.');
        await load(data!.period.periodStart); return;
      }
      const needsAck = draft.kind === 'commitment' && (data!.warnings.length > 0 || data!.period.planConflicted || isBlockedStatus(draft.status) || draft.unknown);
      if (needsAck && !acknowledged) {
        // Keyboard-accessible inline acknowledgement (no window.confirm).
        setDetailSave('idle');
        setPendingAck(true);
        return;
      }
      setPendingAck(false);
      const alloc = await api.planningAllocate(rt, { workItemId: selectedWork.id, teamMemberId: draft.assignee || null, commitmentKind: draft.kind });
      if (!alloc.ok) { setDetailSave('failed'); setError(alloc.error.message); await load(data!.period.periodStart); return; }
    }
    setDetailSave('saved');
    await load(data!.period.periodStart);
  }

  async function saveNotes(): Promise<boolean> {
    setNotesSave('pending');
    const r = await api.planningPeriodSaveMeta(rt, { periodStart: data!.period.periodStart, tradeoffNotes: tradeoff, outcomeSummary: outcome, carryoverNotes: carryover });
    if (!r.ok) { setNotesSave('failed'); setError(r.error.message); return false; }
    setNotesSave('saved'); return true;
  }

  async function closePeriod() {
    if (data!.warnings.length > 0 && !ackWarnings) {
      setError('Acknowledge the remaining warnings in the close review before closing. The plan stays marked Conflicted in history.');
      return;
    }
    if (!(await saveNotes())) return;
    const r = await api.planningPeriodClose(rt, {
      periodStart: data!.period.periodStart,
      acceptWarnings: data!.warnings.length > 0 ? true : undefined,
      carryForwardWorkItemIds: carryIds, outcomeSummary: outcome, carryoverNotes: carryover,
    });
    if (!r.ok) setError(r.error.message); else await load(data!.period.periodStart);
  }

  function reviewWarning(w: PeriodOk['warnings'][number]) {
    if (w.workItemId) { setSelectedWorkId(w.workItemId); return; }
    if (w.teamMemberId) {
      setSelectedMemberId(w.teamMemberId);
      const first = data!.work.find((item) => allocByWork.get(item.id)?.teamMemberId === w.teamMemberId && allocByWork.get(item.id)?.commitmentKind === 'commitment');
      if (first) setSelectedWorkId(first.id);
    }
  }

  function onRowArrowKey(e: React.KeyboardEvent, selector: string) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const idx = rows.indexOf(e.currentTarget as HTMLElement);
    if (idx < 0) return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? Math.min(idx + 1, rows.length - 1) : Math.max(idx - 1, 0);
    rows[next]?.focus();
  }

  function closeDetail() {
    const id = selectedWorkId;
    setSelectedWorkId(null);
    if (id) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-work-id="${id}"]`)?.focus());
  }

  function selectMemberWorkload(teamMemberId: string) {
    setSelectedMemberId(teamMemberId);
    const first = data!.work.find((item) => allocByWork.get(item.id)?.teamMemberId === teamMemberId);
    if (first) setSelectedWorkId(first.id);
  }

  return (
    <section className="stack">
      <header className="period-header">
        <h1 style={{ fontSize: '1.15rem' }}>Weekly planning</h1>
        <span className="muted num">{data.period.periodStart} → {data.period.periodEnd}</span>
        <StatusCue kind={closed ? 'muted' : 'ok'} label={closed ? 'Closed — structure frozen' : 'Open'} />
        {data.period.planConflicted ? <StatusCue kind="conflicted" label="Conflicted" /> : <StatusCue kind="ok" label="Clean" />}
        <span style={{ marginLeft: 'auto' }} className="row">
          <Button onClick={() => { const p = api.previousWeek({ periodStart: data.period.periodStart, periodEnd: data.period.periodEnd }); setSelectedWorkId(null); void load(p.periodStart); }}>← Prev week</Button>
          <Button onClick={() => { const n = api.nextWeek({ periodStart: data.period.periodStart, periodEnd: data.period.periodEnd }); setSelectedWorkId(null); void load(n.periodStart); }}>Next week →</Button>
        </span>
      </header>
      <p className="lede" style={{ marginBottom: 0 }}>Capacity, commitments, and risks in one place. Warnings stay beside the work they affect; nothing is reassigned silently.</p>

      <div className="summary-strip" aria-label="Capacity summary">
        <div className="summary-stat"><span className="stat-label">Net capacity</span><span className="stat-value">{formatHours(totals.netHours)}</span></div>
        <div className="summary-stat"><span className="stat-label">Committed</span><span className="stat-value">{formatHours(totals.committedLoadHours)}</span></div>
        <div className="summary-stat"><span className="stat-label">Remaining</span><span className="stat-value" style={totals.remainingHours < 0 ? { color: 'var(--status-danger)' } : undefined}>{formatHours(totals.remainingHours)}</span>{totals.remainingHours < 0 ? <span className="stat-sub" style={{ color: 'var(--status-danger)' }}>Over committed</span> : null}</div>
        <div className="summary-stat"><span className="stat-label">Unallocated</span><span className="stat-value">{totals.unallocatedCount}</span><span className="stat-sub">work items</span></div>
        <div className="summary-stat"><span className="stat-label">Unestimated</span><span className="stat-value">{totals.unestimatedCommitCount}</span><span className="stat-sub">commitments</span></div>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {data.warnings.length > 0 ? (
        <Banner tone="warning" title={`${data.warnings.length} planning conflict${data.warnings.length === 1 ? '' : 's'}`}>
          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem' }}>
            {data.warnings.map((w, i) => (
              <li key={`${w.code}-${i}`}>
                {w.message}{' '}
                {(w.workItemId || w.teamMemberId) ? <button type="button" className="ghost" style={{ padding: '0 0.3rem' }} onClick={() => reviewWarning(w)}>Review →</button> : null}
              </li>
            ))}
          </ul>
        </Banner>
      ) : null}
      {data.period.planConflicted ? (
        <Banner tone="warning" title="Conflicted">Plan remains conflicted until overload / blocked / unestimated commitment issues are resolved. Acknowledging a warning does not clear this status.</Banner>
      ) : null}

      <div className={`planning-layout ${selectedWork ? 'has-detail' : ''}`}>
        <div>
          <h2>Team workload</h2>
          {data.capacitySummary.members.length === 0 ? (
            <EmptyState title="No capacity configured" actionHint={closed ? 'This closed period had no capacity rows.' : 'Add a team member below to start planning.'} />
          ) : data.capacitySummary.members.map((m) => {
            const state = workloadState(m);
            return (
              <button key={m.teamMemberId} type="button" className={`workload-row ${selectedMemberId === m.teamMemberId ? 'is-selected' : ''}`} onClick={() => selectMemberWorkload(m.teamMemberId)} onKeyDown={(e) => onRowArrowKey(e, '.workload-row')} aria-label={`${m.displayName}: ${workloadLabel(m)}`}>
                <span><strong>{m.displayName}</strong>{m.stretchHours > 0 ? <span className="muted"> · ○ {formatHours(m.stretchHours)} stretch</span> : null}
                  {state !== 'open' ? <span style={{ display: 'block', color: 'var(--status-danger)', fontSize: '0.78rem' }}>{workloadLabel(m)}</span> : null}
                  {m.unestimatedCommitCount > 0 ? <span style={{ display: 'block', color: 'var(--status-conflicted)', fontSize: '0.78rem' }}>{m.unestimatedCommitCount} unestimated commitment{m.unestimatedCommitCount === 1 ? '' : 's'}</span> : null}
                </span>
                <span className={`workload-bar ${state === 'over' ? 'is-over' : ''} ${state === 'zero' ? 'is-zero' : ''}`} aria-hidden="true"><span style={{ width: `${workloadPercent(m)}%` }} /></span>
                <span className="workload-meta">{formatHours(m.committedLoadHours)} / {formatHours(m.netHours)}</span>
              </button>
            );
          })}

          <details style={{ marginTop: 'var(--space-3)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 550 }}>Capacity inputs</summary>
            <p className="muted">Net = Available − Leave − Reserved commitments − Unplanned buffer. Edit a figure, then leave the field to save.</p>
            {!closed ? (
              <div className="row">
                <label>New member <input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addMember(); }} /></label>
                <Button variant="primary" onClick={() => void addMember()}>Add member</Button>
              </div>
            ) : null}
            <table className="table">
              <thead><tr><th>Member</th><th>Available</th><th>Leave</th><th>Reserved</th><th>Buffer</th><th>Net</th><th>Load</th><th>Remain</th></tr></thead>
              <tbody>
                {data.capacitySummary.members.map((m) => (
                  <tr key={m.teamMemberId} style={selectedMemberId === m.teamMemberId ? { background: 'var(--bg-selected)' } : undefined}>
                    <td>{m.displayName}</td>
                    {(['availableHours', 'leaveHours', 'reservedCommitmentHours', 'unplannedBufferHours'] as const).map((field) => (
                      <td key={field}>
                        {closed ? <span className="readonly-field" aria-label={`${m.displayName} ${field} (read-only)`}>{m[field]}</span> : (
                          <input type="number" step={0.5} min={0} defaultValue={m[field]} aria-label={`${m.displayName} ${field}`} onBlur={(e) => {
                            const v = Number(e.target.value);
                            void saveCapacity(m.teamMemberId, {
                              availableHours: field === 'availableHours' ? v : m.availableHours,
                              leaveHours: field === 'leaveHours' ? v : m.leaveHours,
                              reservedCommitmentHours: field === 'reservedCommitmentHours' ? v : m.reservedCommitmentHours,
                              unplannedBufferHours: field === 'unplannedBufferHours' ? v : m.unplannedBufferHours,
                            });
                          }} />
                        )}
                      </td>
                    ))}
                    <td>{m.netHours}</td><td>{m.committedLoadHours}</td>
                    <td style={m.remainingHours < 0 ? { color: 'var(--status-danger)', fontWeight: 600 } : undefined}>{m.remainingHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <h2>Planned work</h2>
          {!closed ? (
            <div className="row" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-2)' }}>
              <label className="field" style={{ flex: '1 1 12rem' }}><span className="field-label">Title</span><input value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addWork(); }} placeholder="Work item title" /></label>
              <Select id="new-work-priority" label="Priority" value={workPriority} onChange={(e) => setWorkPriority(e.target.value as WorkPriority)}>{PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}</Select>
              <label className="field"><span className="field-label">Estimate (h)</span><input type="number" step={0.5} min={0} disabled={workUnknown} value={workEstimate} onChange={(e) => setWorkEstimate(e.target.value)} style={{ width: '6rem' }} /></label>
              <label className="row"><input type="checkbox" checked={workUnknown} onChange={(e) => setWorkUnknown(e.target.checked)} /> Unknown</label>
              <Select id="new-work-app" label="Thread" value={workApp} onChange={(e) => setWorkApp(e.target.value)}><option value="">Unassigned</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
              <Button variant="primary" onClick={() => void addWork()}>Add work</Button>
            </div>
          ) : null}
          {data.work.length === 0 ? (
            <EmptyState title="No demand items" actionHint={closed ? 'No work was recorded for this closed period.' : 'Add a work title above — classify it from its detail panel.'} />
          ) : (
            <div aria-label="Planned work">
              {data.work.map((w) => {
                const a = allocByWork.get(w.id);
                const kind = a?.commitmentKind ?? 'none';
                const itemWarnings = data.warnings.filter((x) => x.workItemId === w.id);
                return (
                  <button key={w.id} type="button" className={`work-row ${selectedWorkId === w.id ? 'is-selected' : ''}`} data-work-id={w.id} onKeyDown={(e) => onRowArrowKey(e, '.work-row')} onClick={() => setSelectedWorkId(w.id)} aria-pressed={selectedWorkId === w.id}>
                    <span className={`priority ${w.priority}`}>{w.priority.toUpperCase()}</span>
                    <span>
                      <span className="work-title">{w.title}</span>
                      <span className="work-meta">
                        <span>{appName(w.applicationId)} · {memberName(a?.teamMemberId ?? null)}</span>
                        <span>{commitmentLabel(kind)}</span>
                        <span>{w.status.replace('_', ' ')}</span>
                        {isBlockedStatus(w.status) ? <span style={{ color: 'var(--status-conflicted)' }}>⚠ Blocked / waiting — decision needed</span> : null}
                        {w.dependencyNotes ? <span>Dependencies noted</span> : null}
                        {itemWarnings.map((x, i) => <span key={i} style={{ color: 'var(--status-danger)' }}>⚠ {x.message}</span>)}
                      </span>
                    </span>
                    <span className="work-nums">{w.estimateUnknown ? <StatusCue kind="unknown" label="Unknown" /> : estimateLabel(w)}<span className="muted"> est</span><br /><span className="muted">{actualLabel(w.actualHours)} actual</span></span>
                  </button>
                );
              })}
            </div>
          )}

          <h2>Close & review</h2>
          <div className="stack">
            <label className="field"><span className="field-label">Trade-off notes — risks accepted, scope changed, and why</span><textarea rows={2} value={tradeoff} onChange={(e) => setTradeoff(e.target.value)} /></label>
            <label className="field"><span className="field-label">Outcome summary — what was delivered</span><textarea rows={2} value={outcome} onChange={(e) => setOutcome(e.target.value)} /></label>
            <label className="field"><span className="field-label">Carryover notes — what moves forward, and why</span><textarea rows={2} value={carryover} onChange={(e) => setCarryover(e.target.value)} /></label>
            <div className="row">
              <Button onClick={() => void saveNotes()}>Save notes</Button>
              <SaveIndicator status={notesSave} />
              {!closed ? <Button variant={showCloseReview ? 'default' : 'primary'} onClick={() => setShowCloseReview((s) => !s)}>{showCloseReview ? 'Hide close review' : 'Review & close…'}</Button> : <StatusCue kind="muted" label="Closed — notes remain editable, structure is frozen" />}
            </div>
            {!closed && showCloseReview ? (
              <div className="panel" role="group" aria-label="Close review">
                <h2 style={{ marginTop: 0 }}>Review before closing</h2>
                <p className="muted">Committed: {data.work.filter((w) => allocByWork.get(w.id)?.commitmentKind === 'commitment').length} · Done: {doneCommitments.length} · Incomplete commitments: {incompleteCommitments.length} · Warnings: {data.warnings.length}</p>
                {data.warnings.length > 0 ? (
                  <>
                    <Banner tone="warning" title="Warnings remain">{data.warnings.map((w) => w.message).join(' ')}</Banner>
                    <label className="row" style={{ marginTop: 'var(--space-2)' }}><input type="checkbox" checked={ackWarnings} onChange={(e) => setAckWarnings(e.target.checked)} /> <span>I acknowledge these warnings. The closed plan stays marked Conflicted.</span></label>
                  </>
                ) : <p className="muted">No warnings. This plan will close as Clean.</p>}
                <fieldset style={{ marginTop: 'var(--space-3)' }}>
                  <legend>Carry forward incomplete commitments (copies into the next period)</legend>
                  {incompleteCommitments.length === 0 ? <p className="muted">Nothing eligible to carry forward.</p> : incompleteCommitments.map((w) => (
                    <label key={w.id} style={{ display: 'block' }}>
                      <input type="checkbox" checked={carryIds.includes(w.id)} onChange={(e) => setCarryIds((prev) => e.target.checked ? [...prev, w.id] : prev.filter((x) => x !== w.id))} /> {w.title}
                    </label>
                  ))}
                </fieldset>
                <div className="row" style={{ marginTop: 'var(--space-3)' }}>
                  <Button onClick={() => setShowCloseReview(false)}>Keep planning</Button>
                  <Button variant="danger" onClick={() => void closePeriod()}>Close period</Button>
                </div>
              </div>
            ) : null}
          </div>
          {historyPayload ? (
            <details><summary>Closed period history snapshot</summary><pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>{historyPayload}</pre></details>
          ) : null}
        </div>

        {selectedWork && draft ? (
          <aside className="detail-panel" aria-label={`Details for ${selectedWork.title}`} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); closeDetail(); } }}>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <h2>Work item</h2>
              <span style={{ marginLeft: 'auto' }}><StatusCue kind={closed ? 'muted' : 'ok'} label={closed ? 'Read-only (closed)' : commitmentLabel(draft.kind)} /></span>
              <button type="button" className="ghost detail-close" onClick={closeDetail} aria-label="Close detail panel (Escape)">✕</button>
            </div>
            {closed ? (
              <dl className="stack" style={{ margin: 0, gap: '0.4rem' }}>
                <div><dt className="muted">Title</dt><dd style={{ margin: 0 }}>{selectedWork.title}</dd></div>
                <div><dt className="muted">Priority / status</dt><dd style={{ margin: 0 }}>{selectedWork.priority.toUpperCase()} · {selectedWork.status.replace('_', ' ')}</dd></div>
                <div><dt className="muted">Estimate / actual</dt><dd style={{ margin: 0 }}>{estimateLabel(selectedWork)} / {actualLabel(selectedWork.actualHours)}</dd></div>
                <div><dt className="muted">Thread</dt><dd style={{ margin: 0 }}>{appName(selectedWork.applicationId)}</dd></div>
                <div><dt className="muted">Dependency notes</dt><dd style={{ margin: 0 }}>{selectedWork.dependencyNotes || '—'}</dd></div>
                <div><dt className="muted">Assignee / kind</dt><dd style={{ margin: 0 }}>{memberName(allocByWork.get(selectedWork.id)?.teamMemberId ?? null)} · {commitmentLabel(allocByWork.get(selectedWork.id)?.commitmentKind ?? 'none')}</dd></div>
              </dl>
            ) : (
              <>
                <label className="field"><span className="field-label">Title</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
                <div className="row">
                  <Select id="detail-priority" label="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as WorkPriority })}>{PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}</Select>
                  <Select id="detail-status" label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as WorkStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</Select>
                </div>
                {isBlockedStatus(draft.status) ? <Banner tone="warning" title="Blocked">This status warns when the item is a commitment. Record the dependency below.</Banner> : null}
                <div className="row">
                  <label className="field"><span className="field-label">Estimate (h)</span><input type="number" step={0.5} min={0} disabled={draft.unknown} value={draft.estimate} onChange={(e) => setDraft({ ...draft, estimate: e.target.value })} style={{ width: '6rem' }} /></label>
                  <label className="row"><input type="checkbox" checked={draft.unknown} onChange={(e) => setDraft({ ...draft, unknown: e.target.checked })} /> Unknown estimate</label>
                  <label className="field"><span className="field-label">Actual (h)</span><input type="number" step={0.5} min={0} value={draft.actual} onChange={(e) => setDraft({ ...draft, actual: e.target.value })} placeholder="—" style={{ width: '6rem' }} /></label>
                </div>
                <Select id="detail-app" label="Thread / project" value={draft.applicationId} onChange={(e) => setDraft({ ...draft, applicationId: e.target.value })}><option value="">Unassigned</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
                <label className="field"><span className="field-label">Dependency notes</span><textarea rows={2} value={draft.dependencyNotes} onChange={(e) => setDraft({ ...draft, dependencyNotes: e.target.value })} placeholder="Waiting on… / blocked by…" /></label>
                <Select id="detail-assignee" label="Assignee" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}><option value="">Unallocated</option>{members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select>
                <div>
                  <span className="field-label" style={{ display: 'block', marginBottom: '0.3rem' }}>Classification</span>
                  <div className="kind-toggle" role="group" aria-label="Commitment classification">
                    {([['none', 'Unclassified'], ['commitment', '● Committed'], ['stretch', '○ Stretch']] as Array<[CommitmentKind, string]>).map(([kind, label]) => (
                      <button key={kind} type="button" aria-pressed={draft.kind === kind} disabled={kind === 'commitment' && !draft.assignee} title={kind === 'commitment' && !draft.assignee ? 'Assign a team member first' : undefined} onClick={() => setDraft({ ...draft, kind })}>{label}</button>
                    ))}
                  </div>
                  {draft.kind === 'commitment' && !draft.assignee ? <p className="muted">A commitment needs an assignee first.</p> : null}
                </div>
                <div className="row">
                  <Button variant="primary" onClick={() => void saveDetail()}>Save changes</Button>
                  <SaveIndicator status={detailSave} />
                </div>
                {pendingAck ? (
                  <div className="panel" role="alert" aria-label="Confirm conflicted commitment">
                    <p style={{ marginTop: 0 }}><strong>Keep this as a commitment?</strong> It may leave the plan conflicted (overload / blocked / unestimated). The plan stays marked Conflicted until the underlying issue is resolved.</p>
                    <div className="row">
                      <Button autoFocus onClick={() => setPendingAck(false)}>Cancel</Button>
                      <Button variant="primary" onClick={() => void saveDetail(true)}>Keep commitment</Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
