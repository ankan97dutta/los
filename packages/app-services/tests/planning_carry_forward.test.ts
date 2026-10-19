import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  planningAllocate,
  planningCapacityUpsert,
  planningMemberUpsert,
  planningPeriodClose,
  planningPeriodGet,
  planningWorkList,
  planningWorkUpsert,
} from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

describe('carry-forward US4', () => {
  it('copies eligible incomplete commitments and auto-creates next period', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const m = await planningMemberUpsert(rt, { displayName: 'Ada' });
    if (!m.ok) throw new Error('m');
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('p');
    const ps = period.data.period.periodStart;
    await planningCapacityUpsert(rt, {
      periodStart: ps,
      teamMemberId: m.data.member.id,
      availableHours: 40,
      leaveHours: 0,
      reservedCommitmentHours: 0,
      unplannedBufferHours: 0,
    });
    const w = await planningWorkUpsert(rt, {
      periodStart: ps,
      title: 'Carry me',
      estimateHours: 4,
      status: 'ready',
    });
    if (!w.ok) throw new Error('w');
    const done = await planningWorkUpsert(rt, {
      periodStart: ps,
      title: 'Done item',
      estimateHours: 2,
      status: 'done',
    });
    if (!done.ok) throw new Error('d');
    await planningAllocate(rt, {
      workItemId: w.data.item.id,
      teamMemberId: m.data.member.id,
      commitmentKind: 'commitment',
    });
    await planningAllocate(rt, {
      workItemId: done.data.item.id,
      teamMemberId: m.data.member.id,
      commitmentKind: 'commitment',
    });

    const bad = await planningPeriodClose(rt, {
      periodStart: ps,
      carryForwardWorkItemIds: [done.data.item.id],
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe('CARRY_FORWARD_INVALID');

    const closed = await planningPeriodClose(rt, {
      periodStart: ps,
      carryForwardWorkItemIds: [w.data.item.id],
    });
    expect(closed.ok).toBe(true);
    if (!closed.ok) return;
    expect(closed.data.carriedForwardCount).toBe(1);
    expect(closed.data.nextPeriodStart).toBeTruthy();
    const next = await planningWorkList(rt, closed.data.nextPeriodStart!);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.data.items.some((i) => i.carriedFromWorkItemId === w.data.item.id)).toBe(true);
  });
});
