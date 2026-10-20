import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import { focusEndEarly, focusGetActive, focusStart, focusTodaySummary } from '../src/focus.js';
import { settingsGet } from '../src/workspace.js';

function rt(now = new Date('2026-10-20T09:00:00.000Z')) {
  return { store: new MemoryStore(), withTransaction: async <T>(fn: () => Promise<T>) => fn(), now: () => now };
}

describe('focus services', () => {
  it('starts, blocks second start, saves last technique', async () => {
    const r = rt();
    const first = await focusStart(r, { taskKind: 'intention', intention: 'Write the doc', technique: 'deep' });
    expect(first.ok).toBe(true);
    const second = await focusStart(r, { taskKind: 'intention', intention: 'Other', technique: 'pomodoro' });
    expect(second.ok).toBe(false);
    const settings = await settingsGet(r);
    if (settings.ok) expect(settings.data.settings.focusTechnique).toBe('deep');
  });
  it('reconciles expired session and counts it today', async () => {
    const store = new MemoryStore();
    let now = new Date('2026-10-20T09:00:00.000Z');
    const r = { store, withTransaction: async <T>(fn: () => Promise<T>) => fn(), now: () => now };
    const started = await focusStart(r, { taskKind: 'intention', intention: 'Short', technique: 'custom', focusMinutes: 5, breakMinutes: 5 });
    expect(started.ok).toBe(true);
    now = new Date('2026-10-20T09:10:00.000Z');
    const active = await focusGetActive(r);
    if (active.ok) expect(active.data.session?.status).toBe('focusDone');
    const summary = await focusTodaySummary(r, { localDate: '2026-10-20' });
    if (summary.ok) { expect(summary.data.blocks).toBe(1); expect(summary.data.focusedMinutes).toBe(5); }
  });
  it('early end under a minute does not count', async () => {
    const r = rt();
    const started = await focusStart(r, { taskKind: 'intention', intention: 'Tiny', technique: 'pomodoro' });
    if (!started.ok) throw new Error('start failed');
    await focusEndEarly(r, { sessionId: started.data.session.id });
    const summary = await focusTodaySummary(r, { localDate: '2026-10-20' });
    if (summary.ok) expect(summary.data.blocks).toBe(0);
  });
});
