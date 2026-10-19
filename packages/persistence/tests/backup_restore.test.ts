import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';
import { exportSqliteBackup, restoreSqliteBackup } from '../src/backup.js';

describe('sqlite backup_restore', () => {
  it('seed inbox → backup → mutate → restore → item returns', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-bak-'));
    const live = join(dir, 'los.sqlite');
    const backup = join(dir, 'backup.sqlite');

    const boot = await bootstrapNodeSqlite(live);
    const repos = createSqliteRepos(boot.session);
    const now = new Date().toISOString();
    await repos.inbox.save({
      id: 'inbox-keep',
      description: 'Persist me',
      status: 'open',
      capturedAt: now,
      updatedAt: now,
    });
    boot.session.close();

    exportSqliteBackup(live, backup);

    const boot2 = await bootstrapNodeSqlite(live);
    const repos2 = createSqliteRepos(boot2.session);
    const now2 = new Date().toISOString();
    await repos2.inbox.save({
      id: 'inbox-keep',
      description: 'Mutated away',
      status: 'dismissed',
      capturedAt: now2,
      updatedAt: now2,
    });
    boot2.session.close();

    restoreSqliteBackup(backup, live);

    const boot3 = await bootstrapNodeSqlite(live);
    const items = await createSqliteRepos(boot3.session).inbox.listOpen();
    expect(items.some((i) => i.id === 'inbox-keep' && i.description === 'Persist me')).toBe(true);
    boot3.session.close();
  });
});
