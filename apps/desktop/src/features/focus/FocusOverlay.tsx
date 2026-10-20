import { useEffect, useRef, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { FocusSession, TechniqueKey } from '@los/domain';
import { api } from '../../lib/api';
import { trapTabKey } from '../../ui/focusTrap';
import {
  blockWording, breakMinutesFor, endsAtLabel, formatClock, isLongBreakDue,
  phaseWord, progressFor, remainingFor, techniqueLabel,
} from './focusView';

export type FocusSeed = { taskKind: 'action' | 'workItem' | 'intention'; taskRef?: string | null; taskLabel?: string };

type Props = {
  rt: WorkspaceRuntime;
  open: boolean;
  seed: FocusSeed | null;
  onClose: () => void;
  onChange?: () => void;
};

function beep(enabled: boolean) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => void ctx.close(), 400);
  } catch { /* sound is a bonus; words still show */ }
}

const TECHNIQUE_CARDS: Array<{ key: TechniqueKey; name: string; detail: string }> = [
  { key: 'pomodoro', name: 'Pomodoro', detail: '25 focus · 5 break' },
  { key: 'deep', name: 'Deep work', detail: '50 focus · 10 break' },
  { key: 'custom', name: 'Custom', detail: 'Your own lengths' },
];

function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v) || min));
  return (
    <div className="focus-stepper">
      <span className="focus-stepper__label" id={`stepper-${label}`}>{label}</span>
      <div className="focus-stepper__control" role="group" aria-labelledby={`stepper-${label}`}>
        <button type="button" aria-label={`Less ${label}`} onClick={() => onChange(clamp(value - 5))}>−</button>
        <input
          type="number" min={min} max={max} value={value} aria-label={label}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(clamp(value + 5))}>+</button>
      </div>
      <span className="focus-stepper__unit">min</span>
    </div>
  );
}

function ProgressRing({ fraction, children }: { fraction: number; children: React.ReactNode }) {
  const R = 104;
  const C = 2 * Math.PI * R;
  return (
    <div className="focus-ring" role="img" aria-label={`${Math.round(fraction * 100)} percent of this phase done`}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle className="focus-ring__track" cx="120" cy="120" r={R} />
        <circle
          className="focus-ring__value" cx="120" cy="120" r={R}
          strokeDasharray={C} strokeDashoffset={C * (1 - fraction)}
        />
      </svg>
      <div className="focus-ring__center">{children}</div>
    </div>
  );
}

function BlockDots({ session }: { session: FocusSession }) {
  return (
    <div className="focus-dots" aria-label={blockWording(session)}>
      {Array.from({ length: session.setSize }, (_, i) => {
        const n = i + 1;
        const done = n < session.blockIndex
          || (n === session.blockIndex && (session.status === 'focusDone' || session.status === 'breakRunning' || session.status === 'breakDone'));
        const current = n === session.blockIndex && !done;
        return <span key={n} className={`focus-dot${done ? ' is-done' : ''}${current ? ' is-current' : ''}`} aria-hidden="true" />;
      })}
      <span className="focus-dots__label">{blockWording(session)}</span>
    </div>
  );
}

export function FocusOverlay({ rt, open, seed, onClose, onChange }: Props) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [intention, setIntention] = useState('');
  const [technique, setTechnique] = useState<TechniqueKey>('pomodoro');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<{ blocks: number; focusedMinutes: number } | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [, setTick] = useState(0);
  const prevStatus = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    setIntention(seed?.taskLabel ?? '');
    let cancelled = false;
    void (async () => {
      const active = await api.focusGetActive(rt);
      if (!cancelled && active.ok) setSession(active.data.session);
      const t = await api.focusTechniques(rt);
      if (!cancelled && t.ok) {
        setTechnique((t.data.settings.focusTechnique as TechniqueKey) || 'pomodoro');
        setFocusMinutes(t.data.settings.focusCustomFocusMinutes ?? 25);
        setBreakMinutes(t.data.settings.focusCustomBreakMinutes ?? 5);
        setSoundOn(t.data.settings.focusSoundEnabled !== false);
      }
      const sum = await api.focusTodaySummary(rt);
      if (!cancelled && sum.ok) setToday({ blocks: sum.data.blocks, focusedMinutes: sum.data.focusedMinutes });
    })();
    const id = setInterval(() => {
      setTick((x) => x + 1);
      void api.focusGetActive(rt).then((r) => { if (!cancelled && r.ok) setSession(r.data.session); });
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, rt, seed]);

  useEffect(() => {
    if (!session) return;
    if ((session.status === 'focusDone' || session.status === 'breakDone') && prevStatus.current !== session.status) {
      beep(soundOn);
    }
    prevStatus.current = session.status;
  }, [session, soundOn]);

  // In the timer view, give the panel itself focus when nothing inside has
  // it, so Space (pause and resume) and the clock stage are keyboard-live.
  useEffect(() => {
    if (!open || !session) return;
    if (!['running', 'paused', 'breakRunning', 'focusDone', 'breakDone'].includes(session.status)) return;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }, [open, session]);

  if (!open) return null;

  async function run(p: Promise<{ ok: boolean; data?: { session: FocusSession }; error?: { message: string } }>) {
    const r = await p;
    if (!r.ok) { setError(r.error?.message ?? 'Something went wrong. Try again.'); return; }
    setError(null);
    if (r.data?.session) setSession(r.data.session);
    const sum = await api.focusTodaySummary(rt);
    if (sum.ok) setToday({ blocks: sum.data.blocks, focusedMinutes: sum.data.focusedMinutes });
    onChange?.();
  }

  async function start() {
    const kind = seed?.taskKind ?? 'intention';
    await run(api.focusStart(rt, {
      taskKind: kind,
      taskRef: seed?.taskRef ?? null,
      taskLabel: kind === 'intention' ? intention : seed?.taskLabel,
      intention: kind === 'intention' ? intention : undefined,
      technique, focusMinutes, breakMinutes,
    }));
  }

  function onPanelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    // Keep Tab inside the dialog so the dimmed page stays out of reach.
    if (trapTabKey(e, panelRef.current)) return;
    if (e.key === ' ' && session && (session.status === 'running' || session.status === 'paused')) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') return;
      e.preventDefault();
      void run(session.status === 'running' ? api.focusPause(rt, session.id) : api.focusResume(rt, session.id));
    }
  }

  const inSession = session && (session.status === 'running' || session.status === 'paused' || session.status === 'breakRunning' || session.status === 'focusDone' || session.status === 'breakDone');
  const endedEarly = session?.status === 'endedEarly';
  const nowIso = new Date().toISOString();
  const phaseClass = !session ? '' : session.status === 'breakRunning' || session.status === 'breakDone'
    ? ' is-break' : session.status === 'paused' ? ' is-paused' : session.status === 'focusDone' ? ' is-done' : '';

  return (
    <div className="focus-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`focus-panel${phaseClass}`}
        role="dialog" aria-modal="true"
        aria-label={session && inSession ? session.taskLabel : 'Start a focus session'}
        onKeyDown={onPanelKeyDown}
      >
        <div className="focus-topbar">
          <span className="focus-eyebrow">
            <span className={`focus-live-dot${session?.status === 'running' ? ' is-live' : ''}`} aria-hidden="true" />
            Focus
          </span>
          <button type="button" className="focus-leave" onClick={onClose} aria-label="Leave focus mode (Escape)">
            Leave <kbd aria-hidden="true">Esc</kbd>
          </button>
        </div>

        {endedEarly && session ? (
          <div className="focus-stage">
            <p className="focus-phase">Session ended early</p>
            <h2 className="focus-task">{session.taskLabel}</h2>
            <p className="focus-message">
              {session.countedFocusSeconds >= 60
                ? 'The time you did focus is kept in your records. It does not count as a finished block.'
                : 'Too short to count, and that is fine. Nothing was added to today.'}
            </p>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <div className="focus-actions">
              {session.taskKind === 'action' ? (
                <button type="button" className="focus-primary" onClick={() => { void run(api.focusClose(rt, session.id, true)); }}>Mark task done</button>
              ) : null}
              <button type="button" className={session.taskKind === 'action' ? 'focus-secondary' : 'focus-primary'} onClick={() => { void run(api.focusClose(rt, session.id)); onClose(); }}>
                Keep task as it is
              </button>
              <button type="button" className="focus-secondary" onClick={() => setSession(null)}>Start something else</button>
            </div>
          </div>
        ) : !inSession || !session ? (
          <form
            className="focus-stage focus-setup"
            onSubmit={(e) => { e.preventDefault(); void start(); }}
          >
            <h2 className="focus-question">What gets your full attention?</h2>

            {seed?.taskLabel ? (
              <div className="focus-seed-card">
                <span className="focus-seed-kind">{seed.taskKind === 'workItem' ? 'Work item' : 'Action'}</span>
                <span className="focus-seed-label">{seed.taskLabel}</span>
              </div>
            ) : (
              <label className="focus-intention">
                <span className="sr-only">What are you working on?</span>
                <input
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="Write it in a few words"
                  autoFocus
                  maxLength={200}
                />
              </label>
            )}

            <div className="focus-techniques" role="radiogroup" aria-label="Technique">
              {TECHNIQUE_CARDS.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  role="radio"
                  aria-checked={technique === card.key}
                  className={`focus-technique${technique === card.key ? ' is-selected' : ''}`}
                  onClick={() => setTechnique(card.key)}
                >
                  <span className="focus-technique__name">{card.name}</span>
                  <span className="focus-technique__detail">
                    {card.key === 'custom' && (focusMinutes !== 25 || breakMinutes !== 5)
                      ? `${focusMinutes} focus · ${breakMinutes} break`
                      : card.detail}
                  </span>
                  {technique === card.key ? <span className="focus-technique__check" aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>

            {technique === 'custom' ? (
              <div className="focus-custom">
                <Stepper label="Focus" value={focusMinutes} min={5} max={180} onChange={setFocusMinutes} />
                <Stepper label="Break" value={breakMinutes} min={5} max={180} onChange={setBreakMinutes} />
                <p className="focus-custom__hint">Whole minutes, 5 to 180. Saved as your Custom lengths when the session starts.</p>
              </div>
            ) : (
              <p className="focus-setup__note">
                {technique === 'deep'
                  ? 'Fifty quiet minutes, then ten to breathe. A long break comes after four blocks.'
                  : 'Twenty-five minutes on, five off. A long break comes after four blocks.'}
              </p>
            )}

            {error ? <p className="error" role="alert">{error}</p> : null}

            <div className="focus-footer">
              <span className="focus-today" aria-live="polite">
                {today
                  ? <>Today so far: <strong>{today.blocks} block{today.blocks === 1 ? '' : 's'}</strong> · <strong>{today.focusedMinutes} min</strong></>
                  : 'Today so far: nothing counted yet'}
              </span>
              <button type="submit" className="focus-start" disabled={!seed?.taskLabel && !intention.trim()}>
                Start focusing
              </button>
            </div>
            <p className="focus-reassure">Nothing starts on its own after a block ends. Leaving never ends the session.</p>
          </form>
        ) : (
          <div className="focus-stage">
            <p className="focus-phase" aria-live="polite">
              {phaseWord(session)}
              {session.status === 'paused' ? <span className="focus-phase__sub">Time held. Resume when you are ready.</span> : null}
            </p>
            <h2 className="focus-task">{session.taskLabel}</h2>

            <ProgressRing fraction={progressFor(session, nowIso)}>
              <span className="focus-clock">{formatClock(remainingFor(session, nowIso))}</span>
              <span className="focus-clock__sub">
                {session.status === 'focusDone' || session.status === 'breakDone'
                  ? 'done'
                  : session.status === 'paused'
                    ? 'held'
                    : endsAtLabel(session)
                      ? `left · ends ${endsAtLabel(session)}`
                      : 'left'}
              </span>
            </ProgressRing>

            <BlockDots session={session} />
            <p className="focus-technique-line">{techniqueLabel(session.technique)}</p>

            <div aria-live="polite">
              {session.status === 'focusDone' ? (
                <p className="focus-message">
                  {isLongBreakDue(session)
                    ? `That is a full set of four. A long break of ${session.longBreakMinutes} minutes is ready when you are.`
                    : 'Focus block done. Take the break, add another block, or stop here.'}
                </p>
              ) : null}
              {session.status === 'breakDone' ? (
                <p className="focus-message">Break done. Start the next block when you are ready.</p>
              ) : null}
              {session.status === 'breakRunning' ? (
                <p className="focus-message">Step away. The timer will tell you when the break is over.</p>
              ) : null}
            </div>

            {error ? <p className="error" role="alert">{error}</p> : null}

            <div className="focus-actions">
              {session.status === 'running' ? (
                <button type="button" className="focus-primary" onClick={() => void run(api.focusPause(rt, session.id))}>Pause</button>
              ) : null}
              {session.status === 'paused' ? (
                <button type="button" className="focus-primary" onClick={() => void run(api.focusResume(rt, session.id))}>Resume</button>
              ) : null}
              {session.status === 'focusDone' ? (
                <button type="button" className="focus-primary" onClick={() => void run(api.focusStartBreak(rt, session.id))}>
                  Start {isLongBreakDue(session) ? `long break (${session.longBreakMinutes} min)` : `break (${breakMinutesFor(session)} min)`}
                </button>
              ) : null}
              {(session.status === 'focusDone' || session.status === 'breakDone') ? (
                <button type="button" className="focus-secondary" onClick={() => void run(api.focusStartNextBlock(rt, session.id))}>Start next block</button>
              ) : null}
            </div>

            <div className="focus-quiet-actions">
              {(session.status === 'running' || session.status === 'paused') ? (
                <button type="button" onClick={() => { if (window.confirm('End this session now? The task stays as it is.')) void run(api.focusEndEarly(rt, session.id)); }}>End session</button>
              ) : null}
              {session.status === 'breakRunning' ? (
                <button type="button" onClick={() => void run(api.focusClose(rt, session.id))}>End break and close</button>
              ) : null}
              {(session.status === 'focusDone' || session.status === 'breakDone') ? (
                <>
                  <button type="button" onClick={() => void run(api.focusClose(rt, session.id))}>Close session</button>
                  {session.taskKind === 'action' ? (
                    <button type="button" onClick={() => void run(api.focusClose(rt, session.id, true))}>Close and mark task done</button>
                  ) : null}
                </>
              ) : null}
              {session.status === 'running' || session.status === 'paused' ? (
                <span className="focus-hint"><kbd>Space</kbd> {session.status === 'running' ? 'pauses' : 'resumes'}</span>
              ) : null}
            </div>

            {today ? (
              <p className="focus-today focus-today--stage">
                Today so far: <strong>{today.blocks} block{today.blocks === 1 ? '' : 's'}</strong> · <strong>{today.focusedMinutes} min</strong>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
