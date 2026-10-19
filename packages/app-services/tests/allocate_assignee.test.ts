import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  planningAllocate,
  planningPeriodGet,
  planningWorkUpsert,
} from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

describe('COMMIT_REQUIRES_ASSIGNEE', () => {
  it('rejects commitment without assignee', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('period');
    const w = await planningWorkUpsert(rt, {
      periodStart: period.data.period.periodStart,
      title: 'Unowned',
      estimateHours: 2,
    });
    if (!w.ok) throw new Error('work');
    const a = await planningAllocate(rt, {
      workItemId: w.data.item.id,
      teamMemberId: null,
      commitmentKind: 'commitment',
    });
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.error.code).toBe('COMMIT_REQUIRES_ASSIGNEE');
  });
});
