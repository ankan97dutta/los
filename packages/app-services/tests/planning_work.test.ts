import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import { planningPeriodGet, planningWorkUpsert } from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

describe('planning work US2', () => {
  it('rejects unknown estimate with hours', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('period');
    const r = await planningWorkUpsert(rt, {
      periodStart: period.data.period.periodStart,
      title: 'Mystery',
      estimateHours: 3,
      estimateUnknown: true,
    });
    expect(r.ok).toBe(false);
  });

  it('persists unknown estimate', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('period');
    const r = await planningWorkUpsert(rt, {
      periodStart: period.data.period.periodStart,
      title: 'Unknown work',
      estimateUnknown: true,
      status: 'blocked',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.item.estimateUnknown).toBe(true);
    expect(r.data.item.estimateHours).toBeNull();
  });
});
