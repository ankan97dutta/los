import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import {
  actionsCreate,
  actionsSetStatus,
  fortnightGet,
  fortnightUpsert,
} from '../src/workspace.js';

describe('fortnight selections include done', () => {
  it('resolves selectedActionIds including completed actions', async () => {
    const rt = {
      store: new MemoryStore(),
      withTransaction: async <T>(fn: () => Promise<T>) => fn(),
    };
    const created = await actionsCreate(rt, 'Ship hardening');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.data.action.id;
    const period = await fortnightGet(rt);
    expect(period.ok).toBe(true);
    if (!period.ok) return;
    const upsert = await fortnightUpsert(rt, {
      periodStart: period.data.period.start,
      selectedActionIds: [id],
      commitments: 'Finish 002',
    });
    expect(upsert.ok).toBe(true);
    await actionsSetStatus(rt, id, 'done');
    const again = await fortnightGet(rt, period.data.period.start);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.plan.selectedActionIds).toContain(id);
    // Repo list with status all still has the action
    const { actionsList } = await import('../src/workspace.js');
    const listed = await actionsList(rt, { status: 'all' });
    expect(listed.ok && listed.data.actions.some((a) => a.id === id && a.status === 'done')).toBe(
      true,
    );
  });
});
