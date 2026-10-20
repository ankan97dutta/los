import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { EmptyState } from '../../ui/EmptyState';

type Props = { rt: WorkspaceRuntime };

type SnapshotItem = {
  id: string;
  title: string;
  estimateHours: number | null;
  estimateUnknown: boolean;
  status: string;
  commitmentKind: string;
  teamMemberName: string | null;
};

function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function parseSnapshot(payload: string | null): SnapshotItem[] | null {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as { items?: SnapshotItem[] };
    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    return null;
  }
}

function statusChip(status: string): { label: string; color: string } {
  switch (status) {
    case 'done': return { label: 'Done', color: 'var(--status-ok)' };
    case 'dropped': return { label: 'Dropped', color: 'var(--muted)' };
    case 'blocked': return { label: 'Blocked', color: 'var(--status-danger)' };
    case 'waiting_external': return { label: 'Waiting on someone', color: 'var(--status-conflicted)' };
    default: return { label: 'Ready', color: 'var(--accent)' };
  }
}

export function PlanningHistoryPanel({ rt }: Props) {
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [conflicted, setConflicted] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (start?: string) => {
      const p = await api.planningPeriodGet(rt, start);
      if (!p.ok) {
        setError(p.error.message);
        return;
      }
      setPeriodStart(p.data.period.periodStart);
      setPeriodEnd(p.data.period.periodEnd);
      setStatus(p.data.period.status);
      setConflicted(p.data.period.planConflicted);
      setOutcome(p.data.period.outcomeSummary ?? '');
      setError(null);
      if (p.data.period.status === 'closed') {
        const h = await api.planningHistoryGet(rt, p.data.period.periodStart);
        setSnapshot(h.ok && h.data.snapshot ? h.data.snapshot.payload : null);
      } else {
        setSnapshot(null);
      }
    },
    [rt],
  );

  useEffect(() => { void load(); }, [load]);

  const items = useMemo(() => parseSnapshot(snapshot), [snapshot]);

  const summary = useMemo(() => {
    if (!items) return null;
    const committed = items.filter((i) => i.commitmentKind === 'commitment');
    return {
      total: items.length,
      committed: committed.length,
      done: items.filter((i) => i.status === 'done').length,
      carriedOrOpen: items.filter((i) => i.status !== 'done' && i.status !== 'dropped').length,
      hours: items.reduce((sum, i) => sum + (i.estimateHours ?? 0), 0),
      unknown: items.filter((i) => i.estimateUnknown).length,
    };
  }, [items]);

  if (!periodStart || !periodEnd || !status) {
    return <p className="muted">Loading your history...</p>;
  }

  const closed = status === 'closed';

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', margin: 0 }}>Planning history</h1>
          <p className="muted" style={{ margin: '0.2rem 0 0' }}>Closed weeks stay exactly as they were. Nothing here can be edited, it is just for looking back.</p>
        </div>
        <div className="date-nav" aria-label="Change week">
          <button type="button" onClick={() => { const prev = api.previousWeek({ periodStart, periodEnd }); void load(prev.periodStart); }}>← Prev</button>
          <span className="date-nav-label num">{prettyDate(periodStart)} to {prettyDate(periodEnd)}</span>
          <button type="button" onClick={() => { const next = api.nextWeek({ periodStart, periodEnd }); void load(next.periodStart); }}>Next →</button>
        </div>
      </div>

      <div className="row">
        <span className="chip">
          <span className="dot" style={{ background: closed ? 'var(--status-ok)' : 'var(--accent)' }} aria-hidden="true" />
          {closed ? 'Week closed and frozen' : 'Week still open'}
        </span>
        {conflicted ? (
          <span className="chip"><span className="dot" style={{ background: 'var(--status-conflicted)' }} aria-hidden="true" />Closed with warnings</span>
        ) : closed ? (
          <span className="chip is-open"><span className="dot" aria-hidden="true" />Closed cleanly</span>
        ) : null}
        {outcome.trim() ? <span className="muted">Outcome: {outcome}</span> : null}
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}

      {!closed ? (
        <EmptyState
          title="This week is still open"
          actionHint="It has not been closed yet, so there is no frozen plan to show. Use Previous and Next to find a week you have already wrapped up."
        />
      ) : items && summary ? (
        <>
          <div className="history-summary">
            <div className="stat-card"><span className="stat-label">Pieces of work</span><div className="stat-value">{summary.total}</div></div>
            <div className="stat-card"><span className="stat-label">Promised</span><div className="stat-value">{summary.committed}</div><span className="stat-sub">commitments</span></div>
            <div className="stat-card"><span className="stat-label">Finished</span><div className="stat-value" style={{ color: 'var(--status-ok)' }}>{summary.done}</div></div>
            <div className="stat-card"><span className="stat-label">Not finished</span><div className="stat-value" style={summary.carriedOrOpen > 0 ? { color: 'var(--status-conflicted)' } : undefined}>{summary.carriedOrOpen}</div></div>
            <div className="stat-card"><span className="stat-label">Estimated</span><div className="stat-value">{summary.hours}h</div><span className="stat-sub">{summary.unknown} without an estimate</span></div>
          </div>

          <div>
            <div className="list-head"><h2>The plan, as it was</h2><span className="count-chip num">{items.length}</span></div>
            {items.length === 0 ? (
              <EmptyState title="No work was on this plan" actionHint="This week was closed without any work items on it." />
            ) : (
              <ul className="item-list">
                {items.map((item) => {
                  const chip = statusChip(item.status);
                  return (
                    <li key={item.id} className="snapshot-item">
                      <span className={`priority ${item.commitmentKind === 'commitment' ? 'p1' : ''}`} title={item.commitmentKind === 'commitment' ? 'Promised' : item.commitmentKind === 'stretch' ? 'Stretch' : 'Unclassified'}>
                        {item.commitmentKind === 'commitment' ? '●' : item.commitmentKind === 'stretch' ? '○' : '·'}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="item-title">{item.title}</span>
                        <span className="item-meta">
                          <span>{item.teamMemberName ?? 'Nobody assigned'}</span>
                          <span>{item.commitmentKind === 'commitment' ? 'Promised' : item.commitmentKind === 'stretch' ? 'Stretch' : 'Unclassified'}</span>
                        </span>
                      </span>
                      <span className="num muted">{item.estimateUnknown ? 'Not estimated' : item.estimateHours != null ? `${item.estimateHours}h` : ''}</span>
                      <span className="chip"><span className="dot" style={{ background: chip.color }} aria-hidden="true" />{chip.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="muted">● means it was promised, ○ means stretch. This list never changes, even if people or threads are renamed later.</p>
          </div>
        </>
      ) : snapshot ? (
        <article className="brief-card">
          <h2 style={{ marginTop: 0 }}>The plan, as it was</h2>
          <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', margin: 0 }}>{snapshot}</pre>
        </article>
      ) : (
        <EmptyState title="This closed week has no saved snapshot" actionHint="That can happen with weeks closed a while ago. Try another week." />
      )}
    </div>
  );
}
