import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  actionsCreate,
  applicationsCreate,
  applicationsList,
  applicationsRemove,
  planningAllocate,
  planningCapacityUpsert,
  planningMemberRemove,
  planningMemberUpsert,
  planningPeriodGet,
  planningWorkUpsert,
} from '../src/index.js';

function makeRt() {
  return {
    store: new MemoryStore(),
    withTransaction: async <T>(fn: () => Promise<T>) => fn(),
  };
}

describe('threads and roster management', () => {
  it('can add a thread beyond four, and remove an unused one', async () => {
    const rt = makeRt();
    const created = await applicationsCreate(rt, 'Platform');
    expect(created.ok).toBe(true);
    const list = await applicationsList(rt);
    expect(list.ok && list.data.applications).toHaveLength(5);
    if (!created.ok) return;
    expect(created.data.application.slotIndex).toBe(5);
    const removed = await applicationsRemove(rt, created.data.application.id);
    expect(removed.ok).toBe(true);
    const after = await applicationsList(rt);
    expect(after.ok && after.data.applications).toHaveLength(4);
  });

  it('refuses to remove a thread linked to an action', async () => {
    const rt = makeRt();
    const thread = await applicationsCreate(rt, 'Mobile');
    if (!thread.ok) throw new Error('create failed');
    await actionsCreate(rt, 'Ship it', thread.data.application.id);
    const removed = await applicationsRemove(rt, thread.data.application.id);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error.message).toContain('linked');
  });

  it('refuses to remove an assigned member, removes an unused one', async () => {
    const rt = makeRt();
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('period failed');
    const ps = period.data.period.periodStart;
    const used = await planningMemberUpsert(rt, { displayName: 'Used' });
    const free = await planningMemberUpsert(rt, { displayName: 'Free' });
    if (!used.ok || !free.ok) throw new Error('member failed');
    await planningCapacityUpsert(rt, { periodStart: ps, teamMemberId: used.data.member.id, availableHours: 40, leaveHours: 0, reservedCommitmentHours: 0, unplannedBufferHours: 0 });
    const work = await planningWorkUpsert(rt, { periodStart: ps, title: 'Task', estimateHours: 2 });
    if (!work.ok) throw new Error('work failed');
    await planningAllocate(rt, { workItemId: work.data.item.id, teamMemberId: used.data.member.id, commitmentKind: 'stretch' });
    const blocked = await planningMemberRemove(rt, used.data.member.id);
    expect(blocked.ok).toBe(false);
    const removed = await planningMemberRemove(rt, free.data.member.id);
    expect(removed.ok).toBe(true);
  });
});
