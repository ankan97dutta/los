import { describe, expect, it } from 'vitest';
import type { FocusSession } from '@los/domain';
import { blockWording, FiredPhases, formatClock, phaseWord } from './focusView';

const base: FocusSession = {
  id: 's1', taskKind: 'intention', taskRef: null, taskLabel: 'Write', technique: 'pomodoro',
  plannedFocusMinutes: 25, plannedBreakMinutes: 5, longBreakMinutes: 20, blockIndex: 2, setSize: 4,
  status: 'running', startedAt: '2026-10-20T09:00:00.000Z', focusEndsAt: '2026-10-20T09:25:00.000Z',
  pausedRemainingSeconds: null, pausedAt: null, breakEndsAt: null, endedAt: null, countedFocusSeconds: 0, finishedLocalDate: null,
};

describe('focusView', () => {
  it('formats clock without negatives', () => {
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(-5)).toBe('00:00');
  });
  it('wording', () => {
    expect(blockWording(base)).toBe('Block 2 of 4');
    expect(phaseWord(base)).toBe('Focusing');
    expect(phaseWord({ ...base, status: 'focusDone' })).toBe('Focus block done');
  });
  it('watcher fires once per session and phase', () => {
    const f = new FiredPhases();
    expect(f.shouldFire('s1', 'focusDone')).toBe(true);
    f.mark('s1', 'focusDone');
    expect(f.shouldFire('s1', 'focusDone')).toBe(false);
    expect(f.shouldFire('s1', 'breakDone')).toBe(true);
    expect(f.shouldFire('s1', 'running')).toBe(false);
  });
});
