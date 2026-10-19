import { describe, expect, it } from 'vitest';
import { createRepos } from '../src/repos.js';
import { MemoryStore } from '../src/memory_store.js';

describe('applications seed', () => {
  it('seeds four applications', async () => {
    const repos = createRepos(new MemoryStore());
    const apps = await repos.applications.list();
    expect(apps).toHaveLength(4);
    expect(apps.map((a) => a.name)).toEqual([
      'Application 1',
      'Application 2',
      'Application 3',
      'Application 4',
    ]);
    const renamed = { ...apps[0], name: 'Platform', updatedAt: new Date().toISOString() };
    await repos.applications.save(renamed);
    const again = await repos.applications.list();
    expect(again[0].name).toBe('Platform');
  });
});
