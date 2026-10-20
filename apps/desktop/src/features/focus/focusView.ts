import type { FocusSession } from '@los/domain';

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${`${m}`.padStart(2, '0')}:${`${r}`.padStart(2, '0')}`;
}

export function remainingFor(session: FocusSession, nowIso: string): number {
  const now = new Date(nowIso).getTime();
  if (session.status === 'paused') return Math.max(0, session.pausedRemainingSeconds ?? 0);
  if (session.status === 'running' && session.focusEndsAt) return Math.max(0, Math.round((new Date(session.focusEndsAt).getTime() - now) / 1000));
  if (session.status === 'breakRunning' && session.breakEndsAt) return Math.max(0, Math.round((new Date(session.breakEndsAt).getTime() - now) / 1000));
  return 0;
}

export function phaseWord(session: FocusSession): string {
  switch (session.status) {
    case 'running': return 'Focusing';
    case 'paused': return 'Paused';
    case 'focusDone': return 'Focus block done';
    case 'breakRunning': return 'On a break';
    case 'breakDone': return 'Break done';
    case 'endedEarly': return 'Ended early';
    default: return 'Done';
  }
}

export function blockWording(session: FocusSession): string {
  return `Block ${session.blockIndex} of ${session.setSize}`;
}

export function techniqueLabel(key: FocusSession['technique']): string {
  switch (key) {
    case 'deep': return 'Deep work';
    case 'custom': return 'Custom';
    default: return 'Pomodoro';
  }
}

/** Length of the current break in minutes, mirroring the domain startBreak rule. */
export function breakMinutesFor(session: FocusSession): number {
  return session.blockIndex >= session.setSize ? session.longBreakMinutes : session.plannedBreakMinutes;
}

export function isLongBreakDue(session: FocusSession): boolean {
  return session.blockIndex >= session.setSize;
}

/**
 * Fraction of the current phase that has elapsed, 0 to 1.
 * Focus phases measure against the planned focus length, breaks against
 * the break that was offered (long break after a full set).
 */
export function progressFor(session: FocusSession, nowIso: string): number {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  if (session.status === 'focusDone' || session.status === 'breakDone') return 1;
  const remaining = remainingFor(session, nowIso);
  if (session.status === 'breakRunning') {
    const total = breakMinutesFor(session) * 60;
    return total > 0 ? clamp(1 - remaining / total) : 0;
  }
  const total = session.plannedFocusMinutes * 60;
  return total > 0 ? clamp(1 - remaining / total) : 0;
}

/** Local clock time the current phase ends, for example "14:32". Null when no deadline runs. */
export function endsAtLabel(session: FocusSession): string | null {
  const iso = session.status === 'breakRunning' ? session.breakEndsAt : session.status === 'running' ? session.focusEndsAt : null;
  if (!iso) return null;
  const d = new Date(iso);
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Tracks which session phases already fired end handling. Pure and testable. */
export class FiredPhases {
  private set = new Set<string>();
  key(sessionId: string, status: string): string { return `${sessionId}:${status}`; }
  shouldFire(sessionId: string, status: string): boolean {
    if (status !== 'focusDone' && status !== 'breakDone') return false;
    return !this.set.has(this.key(sessionId, status));
  }
  mark(sessionId: string, status: string): void { this.set.add(this.key(sessionId, status)); }
}
