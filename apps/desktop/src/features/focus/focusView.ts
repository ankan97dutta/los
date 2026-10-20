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
