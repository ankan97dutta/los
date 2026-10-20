import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { PersonalAction } from '@los/domain';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { Checkbox } from '../../ui/Checkbox';
import { SaveIndicator } from '../../ui/SaveIndicator';

type Props = { rt: WorkspaceRuntime };

type Draft = {
  periodStart: string;
  periodEnd: string;
  commitments: string;
  selectedActionIds: string[];
};

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

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

  useEffect(() => { void load(); }, [load]);

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

  if (!draft) return <p className="muted">Loading your plan...</p>;

  function toggle(id: string, picked: boolean) {
    if (!draft) return;
    const next = new Set(draft.selectedActionIds);
    if (picked) next.add(id);
    else next.delete(id);
    setDraft({ ...draft, selectedActionIds: [...next] });
  }

  return (
    <section className="stack">
      <div>
        <h1>Your two-week plan</h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          Pick the actions you are actually committing to this fortnight. Everything saves as you go.
        </p>
      </div>

      <div className="toolbar">
        <div className="row">
          <button
            type="button"
            onClick={() => {
              const prev = api.previousFortnight({ periodStart: draft.periodStart, periodEnd: draft.periodEnd });
              void load(prev.periodStart);
            }}
          >Previous</button>
          <strong className="num">{prettyDate(draft.periodStart)} to {prettyDate(draft.periodEnd)}</strong>
          <button
            type="button"
            onClick={() => {
              const next = api.nextFortnight({ periodStart: draft.periodStart, periodEnd: draft.periodEnd });
              void load(next.periodStart);
            }}
          >Next</button>
        </div>
        <SaveIndicator status={status} message={error} />
      </div>

      <div className="field">
        <label htmlFor="fortnight-commitments">What are you promising this fortnight?</label>
        <textarea
          id="fortnight-commitments"
          placeholder="For example: ship the pricing page, close the hiring loop, no new side projects."
          value={draft.commitments}
          onChange={(e) => setDraft({ ...draft, commitments: e.target.value })}
        />
      </div>

      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0 }}>In this plan <span className="muted num">({selectedActions.length})</span></h2>
        {selectedActions.length === 0 ? (
          <div className="empty">Nothing picked yet. Choose from your open actions below.</div>
        ) : (
          <ul className="item-list">
            {selectedActions.map((a) => (
              <li key={a.id} className={`item-row ${a.status === 'done' ? 'is-done' : ''}`}>
                <span className={`chip ${a.status === 'done' ? 'is-done' : 'is-open'}`}>
                  <span className="dot" aria-hidden="true" />
                  {a.status === 'done' ? 'Done' : 'To do'}
                </span>
                <div className="item-title">{a.description}</div>
                <button type="button" className="icon-btn" aria-label={`Take "${a.description}" out of this plan`} onClick={() => toggle(a.id, false)}>
                  Take out
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0 }}>
          Your open actions <span className="muted num">({selectionSet.size} of {openActions.length} picked)</span>
        </h2>
        {openActions.length === 0 ? (
          <div className="empty">You have no open actions right now. Add some from the Actions page first.</div>
        ) : (
          <ul className="item-list">
            {openActions.map((a) => {
              const picked = selectionSet.has(a.id);
              return (
                <li key={a.id} className={`item-row ${picked ? 'is-selected' : ''}`}>
                  <Checkbox
                    checked={picked}
                    onChange={(checked) => toggle(a.id, checked)}
                    aria-label={`Include "${a.description}" in this plan`}
                  >
                    <span className="sr-only">Include in plan</span>
                  </Checkbox>
                  <div style={{ minWidth: 0 }}>
                    <div className="item-title">{a.description}</div>
                    <div className="item-meta"><span>{picked ? 'In this plan' : 'Not picked'}</span></div>
                  </div>
                  <span className={`chip ${picked ? 'is-open' : ''}`}>
                    <span className="dot" aria-hidden="true" />
                    {picked ? 'Picked' : 'Open'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
