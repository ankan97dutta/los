import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { Textarea } from '../../ui/Input';
import { SaveIndicator } from '../../ui/SaveIndicator';

type Props = { rt: WorkspaceRuntime };

type Draft = { yearMonth: string; improvementPriorities: string };

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const month = d.getMonth() + 1;
  return `${d.getFullYear()}-${month < 10 ? '0' : ''}${month}`;
}

function prettyMonth(ym: string): string {
  return new Date(`${ym}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const PROMPTS = [
  'What slowed the team down most?',
  'Which decision kept coming back to you?',
  'What will you stop doing?',
  'What deserves more of your time?',
];

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

  useEffect(() => { void load(); }, [load]);

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

  if (!draft) return <p className="muted">Loading your monthly review...</p>;

  const hasText = draft.improvementPriorities.trim().length > 0;
  const wordCount = hasText ? draft.improvementPriorities.trim().split(/\s+/).length : 0;

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Monthly review</h1>
          <p className="lede" style={{ margin: 0 }}>A short, honest look at the month. What you want to get better at, in your own words. It saves as you type.</p>
        </div>
        <div className="stack" style={{ gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          <div className="date-nav" aria-label="Change month">
            <button type="button" onClick={() => void load(shiftMonth(draft.yearMonth, -1))}>← Prev</button>
            <span className="date-nav-label">{prettyMonth(draft.yearMonth)}</span>
            <button type="button" onClick={() => void load(shiftMonth(draft.yearMonth, 1))}>Next →</button>
          </div>
          <SaveIndicator status={status} message={error} />
        </div>
      </div>

      <div className="calendar-layout">
        <article className="brief-card">
          <div className="section-card-head">
            <span className="section-icon is-warning" aria-hidden="true">M</span>
            <div>
              <h2>{prettyMonth(draft.yearMonth)}</h2>
              <p className="muted" style={{ margin: '0.15rem 0 0' }}>
                {hasText ? `${wordCount} ${wordCount === 1 ? 'word' : 'words'} so far. Keep going if there is more.` : 'Nothing written yet. A few honest lines beat a long report.'}
              </p>
            </div>
            <span className={`chip ${hasText ? 'is-open' : ''}`} style={{ marginLeft: 'auto' }}>
              <span className="dot" style={hasText ? { background: 'var(--status-warning)' } : undefined} aria-hidden="true" />
              {hasText ? 'Written' : 'Not started'}
            </span>
          </div>
          <Textarea
            id="monthly-priorities"
            aria-label={`Improvement priorities for ${prettyMonth(draft.yearMonth)}`}
            placeholder={'For example:\nSpend less time in status meetings.\nSay no earlier when the week is already full.\nGive feedback in the moment, not at review time.'}
            rows={10}
            value={draft.improvementPriorities}
            onChange={(e) => setDraft({ ...draft, improvementPriorities: e.target.value })}
          />
        </article>

        <aside className="panel" style={{ alignSelf: 'start' }}>
          <h2 style={{ marginTop: 0 }}>Stuck for words?</h2>
          <p className="muted">Try answering one of these. Click one to drop it into your review as a starting point.</p>
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="icon-btn"
                style={{ textAlign: 'left' }}
                onClick={() => setDraft({
                  ...draft,
                  improvementPriorities: draft.improvementPriorities.trim()
                    ? `${draft.improvementPriorities.trim()}\n\n${prompt} `
                    : `${prompt} `,
                })}
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>Next month, the Calendar view will mark this month in amber so you can spot the months you reviewed.</p>
        </aside>
      </div>
    </section>
  );
}
