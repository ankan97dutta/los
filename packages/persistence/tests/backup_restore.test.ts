import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createInboxItem } from '@los/domain';
import { backupDbFile, loadOrCreateStore, persistStore, restoreDbFile } from '../src/file_store.js';
import { createRepos } from '../src/repos.js';

describe('backup restore smoke', () => {
  it('restores known inbox item from backup file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-db-'));
    const dbPath = join(dir, 'los-db.json');
    const backupPath = join(dir, 'los-db.backup.json');
    try {
      const store = loadOrCreateStore(dbPath);
      const repos = createRepos(store);
      const now = '2026-10-19T12:00:00.000Z';
      const item = createInboxItem('Known backup item', now);
      expect(item.ok).toBe(true);
      if (!item.ok) return;
      await repos.inbox.save(item.data);
      persistStore(dbPath, store);
      backupDbFile(dbPath, backupPath);

      store.data.inbox = [];
      persistStore(dbPath, store);
      expect((await createRepos(loadOrCreateStore(dbPath)).inbox.listOpen()).length).toBe(0);

      restoreDbFile(backupPath, dbPath);
      const restored = loadOrCreateStore(dbPath);
      const open = await createRepos(restored).inbox.listOpen();
      expect(open.some((i) => i.description === 'Known backup item')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
