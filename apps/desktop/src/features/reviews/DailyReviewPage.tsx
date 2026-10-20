import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { DailyNextActionLine } from '@los/domain';
import { newId } from '@los/domain';
import { api } from '../../lib/api';
import { useDebouncedAutosave } from '../../lib/autosave';
import { EmptyState } from '../../ui/EmptyState';
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

export function DailyReviewPage({ rt }: Props) {
  const [date, setDate] = useState(() => api.localToday());
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
      // Keep editor-owned line ids; linked personalActionIds refresh on day navigation.
      if (r.data.createdActionIds.length > 0) {
        setDraft((d) =>
          d
            ? { ...d, nextActionLines: r.data.review.nextActionLines }
            : d,
        );
      }
    },
    [rt],
  );

  const payload = useMemo(() => draft, [draft]);
  const { status, error } = useDebouncedAutosave(payload, async (v) => {
    if (v) await save(v);
  });

  if (!draft) return <p className="muted">Loading daily review…</p>;

  const empty =
    !draft.outcomes &&
    !draft.blockers &&
    !draft.followUps &&
    draft.nextActionLines.every((l) => !l.text.trim());

  const sections: Array<{
    key: 'next' | 'blockers' | 'followUps' | 'outcomes';
    title: string; question: string; hint: string;
  }> = [
    { key: 'next', title: 'Move forward', question: 'What must I move forward today?', hint: 'One clear next action per line.' },
    { key: 'blockers', title: 'Blockers', question: 'Who is blocked, and on what?', hint: 'Name the person and the dependency.' },
    { key: 'followUps', title: 'Decisions & follow-ups', question: 'What decision is waiting for me?', hint: 'Follow-ups you owe other people.' },
    { key: 'outcomes', title: 'Outcomes', question: 'What actually landed?', hint: 'Recorded at review time.' },
  ];

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Today</h1>
          <p className="lede" style={{ margin: 0 }}>Your daily operating brief. Autosaves while you type.</p>
        </div>
        <div className="row">
          <button type="button" onClick={() => setDate((d) => addDays(d, -1))}>← Previous</button>
          <strong className="num">{date}</strong>
          <button type="button" onClick={() => setDate((d) => addDays(d, 1))}>Next →</button>
          <SaveIndicator status={status} message={error} />
        </div>
      </div>

      {empty ? (
        <EmptyState title="No brief for this day yet" actionHint="Start with one next action below — changes autosave." />
      ) : null}

      <div className="brief-grid">
        {sections.map((section) => (
          <div className="brief-section" key={section.key}>
            <h2>{section.title} <span className="brief-q">{section.question}</span></h2>
            {section.key === 'next' ? (
              <div className="stack">
                {draft.nextActionLines.map((line, idx) => (
                  <input
                    key={line.id}
                    aria-label={`Next action ${idx + 1}`}
                    value={line.text}
                    placeholder={idx === 0 ? 'The single most important next action…' : `Next action ${idx + 1}`}
                    onChange={(e) => {
                      const next = [...draft.nextActionLines];
                      next[idx] = { ...line, text: e.target.value };
                      setDraft({ ...draft, nextActionLines: next });
                    }}
                  />
                ))}
                <div><button type="button" onClick={() => setDraft({ ...draft, nextActionLines: [...draft.nextActionLines, { id: newId(), sortOrder: draft.nextActionLines.length, text: '' }] })}>+ Add next action</button></div>
              </div>
            ) : (
              <div className="field">
                <label htmlFor={`daily-${section.key}`} className="field-label">{section.hint}</label>
                <textarea
                  id={`daily-${section.key}`}
                  value={draft[section.key as 'blockers' | 'followUps' | 'outcomes']}
                  onChange={(e) => setDraft({ ...draft, [section.key]: e.target.value })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
