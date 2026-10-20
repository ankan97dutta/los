import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  applicationsList,
  inboxCapture,
  inboxListKept,
  inboxListOpen,
  inboxTriage,
  planningMemberUpsert,
  workspaceResetAll,
} from '../src/index.js';

function makeRt() {
  return {
    store: new MemoryStore(),
    withTransaction: async <T>(fn: () => Promise<T>) => fn(),
  };
}

describe('inbox keep for later + workspace reset', () => {
  it('keep moves an item out of triage into kept, and back', async () => {
    const rt = makeRt();
    const cap = await inboxCapture(rt, 'Park this');
    if (!cap.ok) throw new Error('capture failed');
    const keptRes = await inboxTriage(rt, cap.data.item.id, 'keep');
    expect(keptRes.ok).toBe(true);
    const empty = await inboxListOpen(rt);
    expect(empty.ok && empty.data.items).toHaveLength(0);
    const keptList = await inboxListKept(rt);
    expect(keptList.ok && keptList.data.items[0]?.status).toBe('kept');
    const back = await inboxTriage(rt, cap.data.item.id, 'reopen');
    expect(back.ok).toBe(true);
    const backList = await inboxListOpen(rt);
    expect(backList.ok && backList.data.items).toHaveLength(1);
  });

  it('reset wipes user data and reseeds default applications', async () => {
    const rt = makeRt();
    await inboxCapture(rt, 'Delete me');
    await planningMemberUpsert(rt, { displayName: 'Alex' });
    const reset = await workspaceResetAll(rt);
    expect(reset.ok).toBe(true);
    const afterReset = await inboxListOpen(rt);
    expect(afterReset.ok && afterReset.data.items).toHaveLength(0);
    const apps = await applicationsList(rt);
    expect(apps.ok && apps.data.applications.map((a) => a.name)).toEqual([
      'Thread 1', 'Thread 2', 'Thread 3', 'Thread 4',
    ]);
  });
});
