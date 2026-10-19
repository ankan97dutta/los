import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';

describe('migrations', () => {
  it('migrates and seeds exactly four applications', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-mig-'));
    const dbPath = join(dir, 'los.sqlite');
    const boot = await bootstrapNodeSqlite(dbPath);
    expect(boot.migratedTo).toBe(1);
    const apps = await createSqliteRepos(boot.session).applications.list();
    expect(apps).toHaveLength(4);
    expect(apps.map((a) => a.name)).toEqual([
      'Application 1',
      'Application 2',
      'Application 3',
      'Application 4',
    ]);
    expect(apps.map((a) => a.slotIndex)).toEqual([1, 2, 3, 4]);
    const settings = await createSqliteRepos(boot.session).settings.get();
    expect(settings.fortnightStartWeekday).toBe('mon');
    boot.session.close();
  });
});
