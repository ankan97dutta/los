import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEmptySnapshot } from '../src/memory_store.js';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';

describe('legacy import', () => {
  it('imports valid snapshot when DB absent', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-leg-'));
    const dbPath = join(dir, 'los.sqlite');
    const snap = createEmptySnapshot();
    const now = new Date().toISOString();
    snap.inbox.push({
      id: 'inbox-1',
      description: 'From legacy',
      status: 'open',
      capturedAt: now,
      updatedAt: now,
    });
    const boot = await bootstrapNodeSqlite(dbPath, snap);
    expect(boot.legacyImport.imported).toBe(true);
    const items = await createSqliteRepos(boot.session).inbox.listOpen();
    expect(items.some((i) => i.description === 'From legacy')).toBe(true);
    boot.session.close();
  });

  it('refuses invalid application count', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-leg-bad-'));
    const dbPath = join(dir, 'los.sqlite');
    const snap = createEmptySnapshot();
    snap.applications = snap.applications.slice(0, 2);
    const boot = await bootstrapNodeSqlite(dbPath, snap);
    expect(boot.legacyImport.attempted).toBe(true);
    expect(boot.legacyImport.imported).toBe(false);
    boot.session.close();
  });
});
