import { describe, expect, it } from 'vitest';
import type { FocusSession } from '@los/domain';
import { blockWording, breakMinutesFor, endsAtLabel, FiredPhases, formatClock, isLongBreakDue, phaseWord, progressFor, techniqueLabel } from './focusView';

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
  it('progress, break length and end label', () => {
    const mid = '2026-10-20T09:12:30.000Z'; // halfway through the 25 minute block
    expect(progressFor(base, mid)).toBeCloseTo(0.5, 5);
    expect(progressFor({ ...base, status: 'paused', pausedRemainingSeconds: 1500 }, mid)).toBe(0);
    expect(progressFor({ ...base, status: 'focusDone' }, mid)).toBe(1);
    expect(breakMinutesFor(base)).toBe(5);
    expect(isLongBreakDue({ ...base, blockIndex: 4 })).toBe(true);
    expect(breakMinutesFor({ ...base, blockIndex: 4 })).toBe(20);
    const endDate = new Date('2026-10-20T09:25:00.000Z');
    expect(endsAtLabel(base)).toBe(`${`${endDate.getHours()}`.padStart(2, '0')}:${`${endDate.getMinutes()}`.padStart(2, '0')}`);
    expect(endsAtLabel({ ...base, status: 'paused', pausedRemainingSeconds: 10 })).toBeNull();
    expect(techniqueLabel('deep')).toBe('Deep work');
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
