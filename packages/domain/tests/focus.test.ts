import { describe, expect, it } from 'vitest';
import { createFocusSession, endEarly, pauseSession, reconcileSession, resumeSession, summarizeDay, TECHNIQUES, validateCustomMinutes, validateLongBreak } from '../src/focus.js';

const start = '2026-10-20T09:00:00.000Z';

describe('focus domain', () => {
  it('catalogue values', () => {
    expect(TECHNIQUES.pomodoro.focusMinutes).toBe(25);
    expect(TECHNIQUES.pomodoro.breakMinutes).toBe(5);
    expect(TECHNIQUES.deep.focusMinutes).toBe(50);
    expect(TECHNIQUES.deep.breakMinutes).toBe(10);
  });
  it('validates custom minutes and long break', () => {
    expect(validateCustomMinutes(4, 5).ok).toBe(false);
    expect(validateCustomMinutes(181, 5).ok).toBe(false);
    expect(validateCustomMinutes(25.5, 5).ok).toBe(false);
    expect(validateCustomMinutes(25, 5).ok).toBe(true);
    expect(validateLongBreak(14).ok).toBe(false);
    expect(validateLongBreak(31).ok).toBe(false);
    expect(validateLongBreak(20).ok).toBe(true);
  });
  it('pause and resume keep remaining', () => {
    const s = createFocusSession({ taskKind: 'intention', taskLabel: 'Write', technique: 'pomodoro', nowIso: start });
    if (!s.ok) throw new Error('create failed');
    const paused = pauseSession(s.data, '2026-10-20T09:10:00.000Z');
    expect(paused.pausedRemainingSeconds).toBe(900);
    const resumed = resumeSession(paused, '2026-10-20T10:00:00.000Z');
    expect(resumed.focusEndsAt).toBe('2026-10-20T10:15:00.000Z');
  });
  it('reconcile fixes counted at deadline and never exceeds plan', () => {
    const s = createFocusSession({ taskKind: 'intention', taskLabel: 'Write', technique: 'pomodoro', nowIso: start });
    if (!s.ok) throw new Error('create failed');
    const done = reconcileSession(s.data, '2026-10-20T12:00:00.000Z');
    expect(done.status).toBe('focusDone');
    expect(done.countedFocusSeconds).toBe(1500);
    expect(done.finishedLocalDate).toBe('2026-10-20');
    expect(summarizeDay([done], '2026-10-20')).toEqual({ blocks: 1, focusedMinutes: 25 });
  });
  it('ending early under a minute counts zero', () => {
    const s = createFocusSession({ taskKind: 'intention', taskLabel: 'Write', technique: 'pomodoro', nowIso: start });
    if (!s.ok) throw new Error('create failed');
    const ended = endEarly(s.data, '2026-10-20T09:00:30.000Z');
    expect(ended.countedFocusSeconds).toBe(0);
    expect(summarizeDay([ended], '2026-10-20').blocks).toBe(0);
  });
  it('rejects long intentions', () => {
    const s = createFocusSession({ taskKind: 'intention', taskLabel: 'x'.repeat(201), technique: 'pomodoro', nowIso: start });
    expect(s.ok).toBe(false);
  });
});
