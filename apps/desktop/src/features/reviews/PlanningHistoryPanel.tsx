import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { StatusCue } from '../../ui/StatusCue';

type Props = { rt: WorkspaceRuntime };

export function PlanningHistoryPanel({ rt }: Props) {
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [conflicted, setConflicted] = useState(false);
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

  useEffect(() => {
    void load();
  }, [load]);

  if (!periodStart || !periodEnd || !status) {
    return <p className="muted">Loading planning history…</p>;
  }

  return (
    <div className="stack">
      <div className="row">
        <Button
          onClick={() => {
            const prev = api.previousFortnight({ periodStart, periodEnd });
            void load(prev.periodStart);
          }}
        >
          Previous period
        </Button>
        <strong>
          {periodStart} → {periodEnd}
        </strong>
        <StatusCue
          kind={status === 'closed' ? 'muted' : 'ok'}
          label={status === 'closed' ? 'Closed' : 'Open'}
        />
        {conflicted ? <StatusCue kind="conflicted" label="Conflicted" /> : null}
        <Button
          onClick={() => {
            const next = api.nextFortnight({ periodStart, periodEnd });
            void load(next.periodStart);
          }}
        >
          Next period
        </Button>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {status !== 'closed' ? (
        <EmptyState
          title="No closed snapshot for this period"
          actionHint="Navigate to a closed fortnight to view frozen plan history."
        />
      ) : snapshot ? (
        <details open>
          <summary>Frozen plan snapshot</summary>
          <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
            {snapshot}
          </pre>
        </details>
      ) : (
        <EmptyState title="Closed period without snapshot payload" actionHint="Try another period." />
      )}
    </div>
  );
}
