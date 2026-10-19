import { describe, expect, it } from 'vitest';
import { createRepos } from '../src/repos.js';
import { MemoryStore } from '../src/memory_store.js';
import { newId } from '@los/domain';

describe('monthly upsert', () => {
  it('unique yearMonth', async () => {
    const repos = createRepos(new MemoryStore());
    const now = '2026-10-19T12:00:00.000Z';
    await repos.monthly.save({
      id: newId(),
      yearMonth: '2026-10',
      improvementPriorities: 'A',
      updatedAt: now,
    });
    await repos.monthly.save({
      id: newId(),
      yearMonth: '2026-10',
      improvementPriorities: 'B',
      updatedAt: now,
    });
    const got = await repos.monthly.getByYearMonth('2026-10');
    expect(got?.improvementPriorities).toBe('B');
  });
});
