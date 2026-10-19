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

  return (
    <section className="stack">
      <h1>Daily review</h1>
      <p className="lede">Outcomes, blockers, follow-ups, and next actions. Autosaves while you type.</p>
      <div className="row">
        <button type="button" onClick={() => setDate((d) => addDays(d, -1))}>
          Previous day
        </button>
        <strong>{date}</strong>
        <button type="button" onClick={() => setDate((d) => addDays(d, 1))}>
          Next day
        </button>
        <SaveIndicator status={status} message={error} />
      </div>

      {empty ? (
        <EmptyState
          title="No notes for this day yet"
          actionHint="Start typing — changes autosave."
        />
      ) : null}

      {(
        [
          ['outcomes', 'Outcomes'],
          ['blockers', 'Blockers'],
          ['followUps', 'Follow-ups'],
        ] as const
      ).map(([key, label]) => (
        <div className="field" key={key}>
          <label htmlFor={`daily-${key}`}>{label}</label>
          <textarea
            id={`daily-${key}`}
            value={draft[key]}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        </div>
      ))}

      <div className="stack">
        <strong>Next actions</strong>
        {draft.nextActionLines.map((line, idx) => (
          <input
            key={line.id}
            aria-label={`Next action line ${idx + 1}`}
            value={line.text}
            onChange={(e) => {
              const next = [...draft.nextActionLines];
              next[idx] = { ...line, text: e.target.value };
              setDraft({ ...draft, nextActionLines: next });
            }}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              nextActionLines: [
                ...draft.nextActionLines,
                { id: newId(), sortOrder: draft.nextActionLines.length, text: '' },
              ],
            })
          }
        >
          Add line
        </button>
      </div>
    </section>
  );
}
