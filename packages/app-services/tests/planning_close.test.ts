import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  planningAllocate,
  planningCapacityUpsert,
  planningMemberUpsert,
  planningPeriodClose,
  planningPeriodGet,
  planningWorkUpsert,
  planningHistoryGet,
  planningCapacityUpsert as capUpsert,
} from '../src/capacity_planning.js';
import type { WorkspaceRuntime } from '../src/workspace.js';

describe('period close US4', () => {
  it('snapshots and freezes; live status change does not alter snapshot', async () => {
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
      title: 'Commit me',
      estimateHours: 4,
    });
    if (!w.ok) throw new Error('w');
    await planningAllocate(rt, {
      workItemId: w.data.item.id,
      teamMemberId: m.data.member.id,
      commitmentKind: 'commitment',
    });
    const closed = await planningPeriodClose(rt, { periodStart: ps });
    expect(closed.ok).toBe(true);
    if (!closed.ok) return;

    await planningWorkUpsert(rt, {
      id: w.data.item.id,
      periodStart: ps,
      title: 'Commit me',
      estimateHours: 4,
      status: 'done',
    }).then((r) => {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('PERIOD_CLOSED');
    });

    // Mutate via repo bypass would be wrong; use store to simulate live change on snapshot independence:
    const item = rt.store!.data.candidateWork.find((x) => x.id === w.data.item.id)!;
    item.status = 'done';

    const hist = await planningHistoryGet(rt, ps);
    expect(hist.ok).toBe(true);
    if (!hist.ok || !hist.data.snapshot) return;
    const payload = JSON.parse(hist.data.snapshot.payload) as {
      items: Array<{ id: string; status: string }>;
    };
    expect(payload.items.find((i) => i.id === w.data.item.id)?.status).toBe('ready');
  });

  it('requires acceptWarnings when conflicted', async () => {
    const rt: WorkspaceRuntime = { store: new MemoryStore() };
    const m = await planningMemberUpsert(rt, { displayName: 'Ada' });
    if (!m.ok) throw new Error('m');
    const period = await planningPeriodGet(rt);
    if (!period.ok) throw new Error('p');
    const ps = period.data.period.periodStart;
    await capUpsert(rt, {
      periodStart: ps,
      teamMemberId: m.data.member.id,
      availableHours: 4,
      leaveHours: 0,
      reservedCommitmentHours: 0,
      unplannedBufferHours: 0,
    });
    const w = await planningWorkUpsert(rt, {
      periodStart: ps,
      title: 'Over',
      estimateHours: 20,
    });
    if (!w.ok) throw new Error('w');
    await planningAllocate(rt, {
      workItemId: w.data.item.id,
      teamMemberId: m.data.member.id,
      commitmentKind: 'commitment',
    });
    const denied = await planningPeriodClose(rt, { periodStart: ps });
    expect(denied.ok).toBe(false);
    const allowed = await planningPeriodClose(rt, { periodStart: ps, acceptWarnings: true });
    expect(allowed.ok).toBe(true);
  });
});
