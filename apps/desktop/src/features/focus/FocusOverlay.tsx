import { useEffect, useRef, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { FocusSession, TechniqueKey } from '@los/domain';
import { api } from '../../lib/api';
import { blockWording, formatClock, phaseWord, remainingFor } from './focusView';

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

  useEffect(() => {
    if (!open) return;
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
    return () => { cancelled = true; clearInterval(id); };
  }, [open, rt, seed]);

  useEffect(() => {
    if (!session) return;
    if ((session.status === 'focusDone' || session.status === 'breakDone') && prevStatus.current !== session.status) {
      beep(soundOn);
    }
    prevStatus.current = session.status;
  }, [session, soundOn]);

  if (!open) return null;

  async function run(p: Promise<{ ok: boolean; data?: { session: FocusSession }; error?: { message: string } }>) {
    const r = await p;
    if (!r.ok) { setError(r.error?.message ?? 'Something went wrong.'); return; }
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

  const running = session && (session.status === 'running' || session.status === 'paused' || session.status === 'breakRunning' || session.status === 'focusDone' || session.status === 'breakDone');

  return (
    <div className="focus-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="focus-panel" role="dialog" aria-modal="true" aria-label={session ? session.taskLabel : 'Start a focus session'}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}>
        {!running || !session ? (
          <>
            <h2>Focus on one thing</h2>
            <p className="muted">Pick a technique, then start. Nothing starts on its own after a block ends.</p>
            {seed?.taskLabel ? <p><strong>{seed.taskLabel}</strong></p> : (
              <label className="field">What are you working on?
                <input value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="Write it in a few words" autoFocus />
              </label>
            )}
            <label className="field">Technique
              <select value={technique} onChange={(e) => setTechnique(e.target.value as TechniqueKey)}>
                <option value="pomodoro">Pomodoro (25 focus, 5 break)</option>
                <option value="deep">Deep work (50 focus, 10 break)</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {technique === 'custom' ? (
              <div className="row">
                <label className="field">Focus minutes
                  <input type="number" min={5} max={180} value={focusMinutes} onChange={(e) => setFocusMinutes(Number(e.target.value))} />
                </label>
                <label className="field">Break minutes
                  <input type="number" min={5} max={180} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} />
                </label>
              </div>
            ) : null}
            {error ? <p className="error" role="alert">{error}</p> : null}
            <div className="row">
              <button type="button" className="primary" onClick={() => void start()}>Start focusing</button>
              <button type="button" onClick={onClose}>Leave</button>
            </div>
            {today ? <p className="muted" aria-live="polite">Focus today: {today.blocks} block(s), {today.focusedMinutes} minutes</p> : null}
          </>
        ) : (
          <>
            <p className="muted" style={{ margin: 0 }}>{phaseWord(session)} · {blockWording(session)}</p>
            <h2 style={{ margin: '0.3rem 0' }}>{session.taskLabel}</h2>
            <p className="focus-clock" aria-live="polite">{formatClock(remainingFor(session, new Date().toISOString()))}</p>
            <p className="muted">{session.technique === 'deep' ? 'Deep work' : session.technique === 'custom' ? 'Custom' : 'Pomodoro'}</p>
            <div aria-live="polite" className="muted">
              {session.status === 'focusDone' ? 'Focus block done. Time for a break, or stop here.' : null}
              {session.status === 'breakDone' ? 'Break done. Start the next block when you are ready.' : null}
            </div>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <div className="row">
              {session.status === 'running' ? <button type="button" className="primary" onClick={() => void run(api.focusPause(rt, session.id))}>Pause</button> : null}
              {session.status === 'paused' ? <button type="button" className="primary" onClick={() => void run(api.focusResume(rt, session.id))}>Resume</button> : null}
              {session.status === 'focusDone' ? <button type="button" className="primary" onClick={() => void run(api.focusStartBreak(rt, session.id))}>Start break</button> : null}
              {session.status === 'focusDone' ? <button type="button" onClick={() => void run(api.focusStartNextBlock(rt, session.id))}>Start next block</button> : null}
              {session.status === 'breakDone' ? <button type="button" className="primary" onClick={() => void run(api.focusStartNextBlock(rt, session.id))}>Start next block</button> : null}
              {(session.status === 'running' || session.status === 'paused') ? <button type="button" onClick={() => { if (window.confirm('End this session now? The task stays as it is.')) void run(api.focusEndEarly(rt, session.id)); }}>End session</button> : null}
              {(session.status === 'focusDone' || session.status === 'breakDone') ? (
                <>
                  <button type="button" onClick={() => void run(api.focusClose(rt, session.id))}>Close session</button>
                  {session.taskKind === 'action' ? <button type="button" onClick={() => void run(api.focusClose(rt, session.id, true))}>Close and mark task done</button> : null}
                </>
              ) : null}
              <button type="button" onClick={onClose}>Leave</button>
            </div>
            {today ? <p className="muted">Focus today: {today.blocks} block(s), {today.focusedMinutes} minutes</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
