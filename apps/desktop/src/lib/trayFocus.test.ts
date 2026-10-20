import { describe, expect, it } from 'vitest';
import type { FocusSession } from '@los/domain';
import { trayFocusText } from './trayFocus';

const base: FocusSession = {
  id: 's1', taskKind: 'intention', taskRef: null, taskLabel: 'Write the board update', technique: 'pomodoro',
  plannedFocusMinutes: 25, plannedBreakMinutes: 5, longBreakMinutes: 20, blockIndex: 2, setSize: 4,
  status: 'running', startedAt: '2026-10-20T09:00:00.000Z', focusEndsAt: '2026-10-20T09:25:00.000Z',
  pausedRemainingSeconds: null, pausedAt: null, breakEndsAt: null, endedAt: null, countedFocusSeconds: 0, finishedLocalDate: null,
};

describe('trayFocusText', () => {
  it('clears the tray with no live session', () => {
    expect(trayFocusText(null, base.startedAt)).toEqual({ title: null, tooltip: 'Lead OS', status: 'No focus session' });
    expect(trayFocusText({ ...base, status: 'finished' }, base.startedAt).title).toBeNull();
  });
  it('shows the live clock and task while running', () => {
    const t = trayFocusText({ ...base, status: 'running' }, '2026-10-20T09:10:00.000Z');
    expect(t.title).toBe('15:00');
    expect(t.tooltip).toContain('Write the board update');
    expect(t.tooltip).toContain('Pomodoro');
    expect(t.status).toContain('Focusing');
  });
  it('words paused, break and done states plainly', () => {
    const paused = trayFocusText({ ...base, status: 'paused', pausedRemainingSeconds: 600 }, base.startedAt);
    expect(paused.title).toBe('Paused 10:00');
    const brk = trayFocusText({ ...base, status: 'breakRunning', breakEndsAt: '2026-10-20T09:30:00.000Z' }, '2026-10-20T09:27:00.000Z');
    expect(brk.title).toBe('Break 03:00');
    expect(trayFocusText({ ...base, status: 'focusDone' }, base.startedAt).title).toBe('Done');
  });
});
