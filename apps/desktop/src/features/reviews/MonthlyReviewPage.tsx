import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { SaveIndicator } from '../../ui/SaveIndicator';

type Props = { rt: WorkspaceRuntime };

type Draft = { yearMonth: string; improvementPriorities: string };

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const month = d.getMonth() + 1;
  return `${d.getFullYear()}-${month < 10 ? '0' : ''}${month}`;
}

export function MonthlyReviewPage({ rt }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(
    async (yearMonth?: string) => {
      const r = await api.monthlyGet(rt, yearMonth);
      if (!r.ok) return;
      setDraft({
        yearMonth: r.data.yearMonth,
        improvementPriorities: r.data.review?.improvementPriorities ?? '',
      });
    },
    [rt],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (value: Draft) => {
      const r = await api.monthlyUpsert(rt, {
        yearMonth: value.yearMonth,
        improvementPriorities: value.improvementPriorities,
      });
      if (!r.ok) throw new Error(r.error.message);
    },
    [rt],
  );

  const { status, error } = useDebouncedAutosave(draft, async (v) => {
    if (v) await save(v);
  });

  if (!draft) return <p className="muted">Loading monthly review…</p>;

  return (
    <section className="stack">
      <h1>Monthly review</h1>
      <p className="lede">Improvement priorities — autosaves while you type.</p>
      <div className="row">
        <button type="button" onClick={() => void load(shiftMonth(draft.yearMonth, -1))}>
          Previous month
        </button>
        <strong>{draft.yearMonth}</strong>
        <button type="button" onClick={() => void load(shiftMonth(draft.yearMonth, 1))}>
          Next month
        </button>
        <SaveIndicator status={status} message={error} />
      </div>
      {!draft.improvementPriorities.trim() ? (
        <div className="empty">No priorities recorded for this month yet.</div>
      ) : null}
      <div className="field">
        <label htmlFor="monthly-priorities">Improvement priorities</label>
        <textarea
          id="monthly-priorities"
          value={draft.improvementPriorities}
          onChange={(e) => setDraft({ ...draft, improvementPriorities: e.target.value })}
        />
      </div>
    </section>
  );
}
