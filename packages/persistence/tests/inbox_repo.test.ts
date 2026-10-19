import { describe, expect, it } from 'vitest';
import { createInboxItem } from '@los/domain';
import { createRepos } from '../src/repos.js';
import { MemoryStore } from '../src/memory_store.js';

describe('inbox persistence', () => {
  it('survives reopen of store snapshot', async () => {
    const store = new MemoryStore();
    const repos = createRepos(store);
    const now = '2026-10-19T12:00:00.000Z';
    const item = createInboxItem('Persist me', now);
    expect(item.ok).toBe(true);
    if (!item.ok) return;
    await repos.inbox.save(item.data);

    const reopened = new MemoryStore(store.clone());
    const repos2 = createRepos(reopened);
    const open = await repos2.inbox.listOpen();
    expect(open).toHaveLength(1);
    expect(open[0].description).toBe('Persist me');
  });
});
