import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  planningCapacityUpsert,
  planningMemberUpsert,
  planningPeriodGet,
} from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

function rt(): WorkspaceRuntime {
  return { store: new MemoryStore() };
}

describe('capacity planning US1', () => {
  it('upserts capacity and returns net hours', async () => {
    const runtime = rt();
    const m = await planningMemberUpsert(runtime, { displayName: 'Ada' });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    const period = await planningPeriodGet(runtime);
    expect(period.ok).toBe(true);
    if (!period.ok) return;
    const cap = await planningCapacityUpsert(runtime, {
      periodStart: period.data.period.periodStart,
      teamMemberId: m.data.member.id,
      availableHours: 40,
      leaveHours: 8,
      reservedCommitmentHours: 4,
      unplannedBufferHours: 4,
    });
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    expect(cap.data.netHours).toBe(24);
    const again = await planningPeriodGet(runtime, period.data.period.periodStart);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.capacitySummary.members[0]?.netHours).toBe(24);
  });
});
