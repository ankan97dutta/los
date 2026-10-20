import { err, ok, type Result } from './result.js';
import { newId } from './validation.js';

export type TechniqueKey = 'pomodoro' | 'deep' | 'custom';
export type FocusTaskKind = 'action' | 'workItem' | 'intention';
export type FocusStatus =
  | 'running'
  | 'paused'
  | 'focusDone'
  | 'breakRunning'
  | 'breakDone'
  | 'finished'
  | 'endedEarly';

export type FocusTechnique = {
  key: TechniqueKey;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
  blocksBeforeLongBreak: number;
  longBreakMinutes: number;
};

export const TECHNIQUES: Record<TechniqueKey, FocusTechnique> = {
  pomodoro: { key: 'pomodoro', label: 'Pomodoro', focusMinutes: 25, breakMinutes: 5, blocksBeforeLongBreak: 4, longBreakMinutes: 20 },
  deep: { key: 'deep', label: 'Deep work', focusMinutes: 50, breakMinutes: 10, blocksBeforeLongBreak: 4, longBreakMinutes: 20 },
  custom: { key: 'custom', label: 'Custom', focusMinutes: 25, breakMinutes: 5, blocksBeforeLongBreak: 4, longBreakMinutes: 20 },
};

export type FocusSession = {
  id: string;
  taskKind: FocusTaskKind;
  taskRef: string | null;
  taskLabel: string;
  technique: TechniqueKey;
  plannedFocusMinutes: number;
  plannedBreakMinutes: number;
  longBreakMinutes: number;
  blockIndex: number;
  setSize: number;
  status: FocusStatus;
  startedAt: string;
  focusEndsAt: string | null;
  pausedRemainingSeconds: number | null;
  pausedAt: string | null;
  breakEndsAt: string | null;
  endedAt: string | null;
  countedFocusSeconds: number;
  finishedLocalDate: string | null;
};

export function validateCustomMinutes(focusMinutes: number, breakMinutes: number): Result<true> {
  for (const [name, v] of [['Focus minutes', focusMinutes], ['Break minutes', breakMinutes]] as const) {
    if (!Number.isInteger(v) || v < 5 || v > 180) return err('VALIDATION_ERROR', `${name} must be a whole number between 5 and 180.`);
  }
  return ok(true);
}

export function validateLongBreak(minutes: number): Result<true> {
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 30) return err('VALIDATION_ERROR', 'Long break must be a whole number between 15 and 30 minutes.');
  return ok(true);
}

export function localDateOf(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function createFocusSession(input: {
  taskKind: FocusTaskKind;
  taskRef?: string | null;
  taskLabel: string;
  technique: TechniqueKey;
  focusMinutes?: number;
  breakMinutes?: number;
  longBreakMinutes?: number;
  blockIndex?: number;
  nowIso: string;
  id?: string;
}): Result<FocusSession> {
  const label = input.taskLabel.trim();
  if (!label || label.length > 200) return err('VALIDATION_ERROR', 'Focus intention must be 1 to 200 characters.');
  const base = TECHNIQUES[input.technique];
  const focusMinutes = input.technique === 'custom' ? input.focusMinutes ?? base.focusMinutes : base.focusMinutes;
  const breakMinutes = input.technique === 'custom' ? input.breakMinutes ?? base.breakMinutes : base.breakMinutes;
  const longBreakMinutes = input.longBreakMinutes ?? base.longBreakMinutes;
  const v = validateCustomMinutes(focusMinutes, breakMinutes);
  if (!v.ok) return v;
  const lv = validateLongBreak(longBreakMinutes);
  if (!lv.ok) return lv;
  return ok({
    id: input.id ?? newId(),
    taskKind: input.taskKind,
    taskRef: input.taskRef ?? null,
    taskLabel: label,
    technique: input.technique,
    plannedFocusMinutes: focusMinutes,
    plannedBreakMinutes: breakMinutes,
    longBreakMinutes,
    blockIndex: input.blockIndex ?? 1,
    setSize: base.blocksBeforeLongBreak,
    status: 'running',
    startedAt: input.nowIso,
    focusEndsAt: addMinutes(input.nowIso, focusMinutes),
    pausedRemainingSeconds: null,
    pausedAt: null,
    breakEndsAt: null,
    endedAt: null,
    countedFocusSeconds: 0,
    finishedLocalDate: null,
  });
}

export function remainingSeconds(session: FocusSession, nowIso: string): number {
  const now = new Date(nowIso).getTime();
  if (session.status === 'paused') return Math.max(0, session.pausedRemainingSeconds ?? 0);
  if (session.status === 'running' && session.focusEndsAt) return Math.max(0, Math.round((new Date(session.focusEndsAt).getTime() - now) / 1000));
  if (session.status === 'breakRunning' && session.breakEndsAt) return Math.max(0, Math.round((new Date(session.breakEndsAt).getTime() - now) / 1000));
  return 0;
}

export function pauseSession(session: FocusSession, nowIso: string): FocusSession {
  if (session.status !== 'running') return session;
  return { ...session, status: 'paused', pausedRemainingSeconds: remainingSeconds(session, nowIso), pausedAt: nowIso };
}

export function resumeSession(session: FocusSession, nowIso: string): FocusSession {
  if (session.status !== 'paused') return session;
  const rem = session.pausedRemainingSeconds ?? 0;
  return { ...session, status: 'running', focusEndsAt: new Date(new Date(nowIso).getTime() + rem * 1000).toISOString(), pausedRemainingSeconds: null, pausedAt: null };
}

function fixCounted(session: FocusSession, atIso: string): FocusSession {
  const planned = session.plannedFocusMinutes * 60;
  const elapsed = session.pausedRemainingSeconds != null && session.status === 'paused'
    ? planned - session.pausedRemainingSeconds
    : planned;
  return { ...session, countedFocusSeconds: Math.min(planned, Math.max(0, elapsed)), finishedLocalDate: localDateOf(atIso) };
}

/** Apply deadline transitions. Counted values are fixed once, at focus end. */
export function reconcileSession(session: FocusSession, nowIso: string): FocusSession {
  const now = new Date(nowIso).getTime();
  if (session.status === 'running' && session.focusEndsAt && now >= new Date(session.focusEndsAt).getTime()) {
    const fixed = fixCounted({ ...session, countedFocusSeconds: session.plannedFocusMinutes * 60 }, session.focusEndsAt);
    return { ...fixed, status: 'focusDone', endedAt: session.focusEndsAt };
  }
  if (session.status === 'breakRunning' && session.breakEndsAt && now >= new Date(session.breakEndsAt).getTime()) {
    return { ...session, status: 'breakDone', endedAt: session.breakEndsAt };
  }
  return session;
}

export function endEarly(session: FocusSession, nowIso: string): FocusSession {
  const planned = session.plannedFocusMinutes * 60;
  let elapsed = 0;
  if (session.status === 'paused') elapsed = planned - (session.pausedRemainingSeconds ?? planned);
  else if (session.focusEndsAt) elapsed = planned - remainingSeconds(session, nowIso);
  const counted = elapsed < 60 ? 0 : Math.min(planned, Math.max(0, Math.round(elapsed)));
  return { ...session, status: 'endedEarly', endedAt: nowIso, countedFocusSeconds: counted, finishedLocalDate: counted > 0 ? localDateOf(nowIso) : session.finishedLocalDate };
}

export function startBreak(session: FocusSession, nowIso: string): FocusSession {
  const longDue = session.blockIndex >= session.setSize;
  const mins = longDue ? session.longBreakMinutes : session.plannedBreakMinutes;
  return { ...session, status: 'breakRunning', breakEndsAt: addMinutes(nowIso, mins), endedAt: null };
}

export function closeSession(session: FocusSession): FocusSession {
  if (session.status === 'endedEarly') return session;
  return { ...session, status: 'finished' };
}

export function isActive(session: FocusSession): boolean {
  return session.status === 'running' || session.status === 'paused' || session.status === 'breakRunning';
}

export function isCounted(session: FocusSession): boolean {
  return session.finishedLocalDate != null && session.status !== 'endedEarly' && session.countedFocusSeconds > 0;
}

export function summarizeDay(sessions: FocusSession[], localDate: string): { blocks: number; focusedMinutes: number } {
  const counted = sessions.filter((s) => s.finishedLocalDate === localDate && isCounted(s));
  const secs = counted.reduce((a, s) => a + s.countedFocusSeconds, 0);
  return { blocks: counted.length, focusedMinutes: Math.floor(secs / 60) };
}
