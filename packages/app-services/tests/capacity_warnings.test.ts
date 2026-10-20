import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  planningAllocate,
  planningCapacityUpsert,
  planningMemberUpsert,
  planningPeriodGet,
  planningWorkUpsert,
} from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

describe('soft-gate warnings US3', () => {
  it('allocate persists overload and returns planConflicted without acceptWarnings', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const m = await planningMemberUpsert(rt, { displayName: 'Ada' });
    if (!m.ok) throw new Error('member');
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('period');
    const ps = period.data.period.periodStart;
    await planningCapacityUpsert(rt, {
      periodStart: ps,
      teamMemberId: m.data.member.id,
      availableHours: 8,
      leaveHours: 0,
      reservedCommitmentHours: 0,
      unplannedBufferHours: 0,
    });
    const w = await planningWorkUpsert(rt, {
      periodStart: ps,
      title: 'Big',
      estimateHours: 16,
      estimateUnknown: false,
    });
    if (!w.ok) throw new Error('work');
    const a = await planningAllocate(rt, {
      workItemId: w.data.item.id,
      teamMemberId: m.data.member.id,
      commitmentKind: 'commitment',
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.data.planConflicted).toBe(true);
    expect(a.data.warnings.some((x) => x.code === 'CAPACITY_OVERLOAD')).toBe(true);
  });
});
