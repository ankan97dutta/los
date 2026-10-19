import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  actionsCreate,
  dailyUpsert,
  inboxCapture,
  inboxTriage,
  localToday,
} from '../src/workspace.js';

describe('workspace services', () => {
  it('capture triage daily next action', async () => {
    const rt = { store: new MemoryStore() };
    const cap = await inboxCapture(rt, 'Incoming');
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    const triage = await inboxTriage(rt, cap.data.item.id, 'convert');
    expect(triage.ok).toBe(true);
    const date = localToday();
    const daily = await dailyUpsert(rt, {
      date,
      outcomes: 'Ship',
      blockers: '',
      followUps: '',
      nextActionLines: [{ id: 'l1', sortOrder: 0, text: 'Write notes' }],
    });
    expect(daily.ok).toBe(true);
    if (daily.ok) expect(daily.data.createdActionIds).toHaveLength(1);
    const manual = await actionsCreate(rt, 'Manual', null);
    expect(manual.ok).toBe(true);
  });
});
