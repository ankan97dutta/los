import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { PersonalAction } from '@los/domain';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { SaveIndicator } from '../../ui/SaveIndicator';

type Props = { rt: WorkspaceRuntime };

type Draft = {
  periodStart: string;
  periodEnd: string;
  commitments: string;
  selectedActionIds: string[];
};

export function FortnightPlanPage({ rt }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openActions, setOpenActions] = useState<PersonalAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<PersonalAction[]>([]);

  const load = useCallback(
    async (periodStart?: string) => {
      const [planRes, openRes, allRes] = await Promise.all([
        api.fortnightGet(rt, periodStart),
        api.actionsList(rt, { status: 'open' }),
        api.actionsList(rt, { status: 'all' }),
      ]);
      if (planRes.ok) {
        const selectedIds = [...planRes.data.plan.selectedActionIds];
        setDraft({
          periodStart: planRes.data.period.start,
          periodEnd: planRes.data.period.end,
          commitments: planRes.data.plan.commitments,
          selectedActionIds: selectedIds,
        });
        if (allRes.ok) {
          const byId = new Map(allRes.data.actions.map((a) => [a.id, a]));
          setSelectedActions(
            selectedIds.map((id) => byId.get(id)).filter((a): a is PersonalAction => Boolean(a)),
          );
        }
      }
      if (openRes.ok) setOpenActions(openRes.data.actions);
    },
    [rt],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (value: Draft) => {
      const r = await api.fortnightUpsert(rt, {
        periodStart: value.periodStart,
        commitments: value.commitments,
        selectedActionIds: value.selectedActionIds,
      });
      if (!r.ok) throw new Error(r.error.message);
    },
    [rt],
  );

  const { status, error } = useDebouncedAutosave(draft, async (v) => {
    if (v) await save(v);
  });

  const selectionSet = useMemo(() => new Set(draft?.selectedActionIds ?? []), [draft]);

  if (!draft) return <p className="muted">Loading fortnight plan…</p>;

  return (
    <section className="stack">
      <h1>Fortnight plan</h1>
      <p className="lede">Personal commitments for the current 14-day period.</p>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            const prev = api.previousFortnight({
              periodStart: draft.periodStart,
              periodEnd: draft.periodEnd,
            });
            void load(prev.periodStart);
          }}
        >
          Previous
        </button>
        <strong>
          {draft.periodStart} → {draft.periodEnd}
        </strong>
        <button
          type="button"
          onClick={() => {
            const next = api.nextFortnight({
              periodStart: draft.periodStart,
              periodEnd: draft.periodEnd,
            });
            void load(next.periodStart);
          }}
        >
          Next
        </button>
        <SaveIndicator status={status} message={error} />
      </div>

      {!draft.commitments && draft.selectedActionIds.length === 0 ? (
        <div className="empty">No plan yet for this fortnight. Select actions or add commitments.</div>
      ) : null}

      <div className="field">
        <label htmlFor="fortnight-commitments">Commitments</label>
        <textarea
          id="fortnight-commitments"
          value={draft.commitments}
          onChange={(e) => setDraft({ ...draft, commitments: e.target.value })}
        />
      </div>

      <div className="stack">
        <strong>Selected actions (includes completed)</strong>
        {selectedActions.length === 0 ? (
          <div className="empty">No selections yet.</div>
        ) : (
          <ul className="list">
            {selectedActions.map((a) => (
              <li key={a.id}>
                <span>
                  {a.description}{' '}
                  <span className="muted">({a.status === 'done' ? 'done' : 'open'})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="stack">
        <strong>Open actions</strong>
        {openActions.length === 0 ? (
          <div className="empty">No open actions to select.</div>
        ) : (
          <ul className="list">
            {openActions.map((a) => (
              <li key={a.id}>
                <label className="row">
                  <input
                    type="checkbox"
                    checked={selectionSet.has(a.id)}
                    onChange={(e) => {
                      const next = new Set(draft.selectedActionIds);
                      if (e.target.checked) next.add(a.id);
                      else next.delete(a.id);
                      setDraft({ ...draft, selectedActionIds: [...next] });
                    }}
                  />
                  <span>{a.description}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
