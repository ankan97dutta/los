import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { DailyNextActionLine } from '@los/domain';
import { newId } from '@los/domain';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { EmptyState } from '../../ui/EmptyState';
import { Input, Textarea } from '../../ui/Input';
import { SaveIndicator } from '../../ui/SaveIndicator';

type Props = { rt: WorkspaceRuntime };

type Draft = {
  date: string;
  outcomes: string;
  blockers: string;
  followUps: string;
  nextActionLines: DailyNextActionLine[];
};

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const SECTION_META = {
  next: { icon: '→', tone: 'is-accent', placeholder: '' },
  blockers: { icon: '!', tone: 'is-danger', placeholder: 'For example: Sam is waiting on the API keys from DevOps.' },
  followUps: { icon: '?', tone: 'is-warning', placeholder: 'For example: I owe Priya a yes or no on the launch date.' },
  outcomes: { icon: '✓', tone: 'is-ok', placeholder: 'For example: the pricing page shipped, hiring loop closed.' },
} as const;

export function DailyReviewPage({ rt }: Props) {
  const today = api.localToday();
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    void api.dailyGet(rt, date).then((r) => {
      if (!r.ok) return;
      const review = r.data.review;
      setDraft({
        date,
        outcomes: review?.outcomes ?? '',
        blockers: review?.blockers ?? '',
        followUps: review?.followUps ?? '',
        nextActionLines: review?.nextActionLines?.length
          ? review.nextActionLines
          : [{ id: newId(), sortOrder: 0, text: '', personalActionId: undefined }],
      });
    });
  }, [rt, date]);

  const save = useCallback(
    async (value: Draft) => {
      const r = await api.dailyUpsert(rt, {
        date: value.date,
        outcomes: value.outcomes,
        blockers: value.blockers,
        followUps: value.followUps,
        nextActionLines: value.nextActionLines.map((l, i) => ({
          id: l.id,
          sortOrder: i,
          text: l.text,
          personalActionId: l.personalActionId,
        })),
      });
      if (!r.ok) throw new Error(r.error.message);
      if (r.data.createdActionIds.length > 0) {
        setDraft((d) => (d ? { ...d, nextActionLines: r.data.review.nextActionLines } : d));
      }
    },
    [rt],
  );

  const payload = useMemo(() => draft, [draft]);
  const { status, error } = useDebouncedAutosave(payload, async (v) => {
    if (v) await save(v);
  });

  if (!draft) return <p className="muted">Loading your brief...</p>;

  const empty =
    !draft.outcomes &&
    !draft.blockers &&
    !draft.followUps &&
    draft.nextActionLines.every((l) => !l.text.trim());

  const sections: Array<{
    key: 'next' | 'blockers' | 'followUps' | 'outcomes';
    title: string; question: string; hint: string;
  }> = [
    { key: 'next', title: 'Move forward', question: 'What must I move forward today?', hint: 'One clear next action per line. Keep them small enough to actually finish.' },
    { key: 'blockers', title: 'Blockers', question: 'Who is blocked, and on what?', hint: 'Name the person and what they are waiting on.' },
    { key: 'followUps', title: 'Decisions and follow-ups', question: 'What decision is waiting for me?', hint: 'Things you owe other people: answers, reviews, approvals.' },
    { key: 'outcomes', title: 'Outcomes', question: 'What actually landed?', hint: 'Fill this in when you look back at the day.' },
  ];

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Today</h1>
          <p className="lede" style={{ margin: 0 }}>Your short morning brief. It saves as you type, so just write.</p>
        </div>
        <div className="stack" style={{ gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          <div className="date-nav" aria-label="Change day">
            <button type="button" aria-label="Previous day" onClick={() => setDate((d) => addDays(d, -1))}>←</button>
            <span className="date-nav-label">{prettyDate(date)}</span>
            <button type="button" aria-label="Next day" onClick={() => setDate((d) => addDays(d, 1))}>→</button>
            {date !== today ? (
              <button type="button" className="date-nav-today" onClick={() => setDate(today)}>Today</button>
            ) : null}
          </div>
          <SaveIndicator status={status} message={error} />
        </div>
      </div>

      {empty ? (
        <EmptyState title="No brief for this day yet" actionHint="Start with one next action below. It saves as you type." />
      ) : null}

      <div className="brief-list">
        {sections.map((section) => {
          const meta = SECTION_META[section.key];
          return (
            <article className="brief-card" key={section.key}>
              <div className="section-card-head">
                <span className={`section-icon ${meta.tone}`} aria-hidden="true">{meta.icon}</span>
                <div>
                  <h2>{section.title} <span className="brief-q">{section.question}</span></h2>
                  <p className="muted" style={{ margin: '0.15rem 0 0' }}>{section.hint}</p>
                </div>
              </div>
              {section.key === 'next' ? (
                <div className="stack" style={{ gap: 'var(--space-2)' }}>
                  {draft.nextActionLines.map((line, idx) => (
                    <div className="next-action-row" key={line.id}>
                      <span className="next-action-num" aria-hidden="true">{idx + 1}</span>
                      <Input
                        id={`next-action-${line.id}`}
                        aria-label={`Next action ${idx + 1}`}
                        value={line.text}
                        placeholder={idx === 0 ? 'The single most important thing to move today' : `Next action ${idx + 1}`}
                        onChange={(e) => {
                          const next = [...draft.nextActionLines];
                          next[idx] = { ...line, text: e.target.value };
                          setDraft({ ...draft, nextActionLines: next });
                        }}
                      />
                      {draft.nextActionLines.length > 1 ? (
                        <button
                          type="button"
                          className="remove-line"
                          aria-label={`Remove next action ${idx + 1}`}
                          onClick={() => setDraft({ ...draft, nextActionLines: draft.nextActionLines.filter((l) => l.id !== line.id) })}
                        >×</button>
                      ) : <span />}
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setDraft({ ...draft, nextActionLines: [...draft.nextActionLines, { id: newId(), sortOrder: draft.nextActionLines.length, text: '' }] })}
                    >+ Add another</button>
                  </div>
                </div>
              ) : (
                <Textarea
                  id={`daily-${section.key}`}
                  aria-label={section.question}
                  placeholder={meta.placeholder}
                  value={draft[section.key as 'blockers' | 'followUps' | 'outcomes']}
                  onChange={(e) => setDraft({ ...draft, [section.key]: e.target.value })}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
