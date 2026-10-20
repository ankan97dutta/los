import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '@los/persistence/node';
import { createSqliteRepos } from '@los/persistence';
import { inboxCapture, inboxListKept, inboxListOpen, inboxTriage } from '../src/workspace.js';

/** Same path Tauri `db_bootstrap` uses (macOS). */
function tauriAppDataDbPath(): string {
  return join(homedir(), 'Library/Application Support/com.los.desktop/los/los.sqlite');
}

function makeRt(
  session: Awaited<ReturnType<typeof bootstrapNodeSqlite>>['session'],
  dbPath: string,
) {
  const sqliteRepos = createSqliteRepos(session);
  return {
    sqliteRepos,
    withTransaction: <T>(fn: () => Promise<T>) => session.withTransaction(fn),
    dbPath,
    dbReady: true as const,
    globalShortcutRegistered: false,
    globalShortcutError: 'Simulated OS deny / registration failure (SC-H07)',
    globalShortcutAvailable: true,
    trayAvailable: false,
  };
}

describe('002 remaining smokes (Tauri app-data path)', () => {
  const dbPath = tauriAppDataDbPath();
  const marker = `SC-H01 smoke ${Date.now()}`;

  it('T042 offline core: capture → triage keep → list (local SQLite only)', async () => {
    mkdirSync(join(dbPath, '..'), { recursive: true });
    const boot = await bootstrapNodeSqlite(dbPath);
    const rt = makeRt(boot.session, dbPath);
    const cap = await inboxCapture(rt, marker);
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    const triage = await inboxTriage(rt, cap.data.item.id, 'keep');
    expect(triage.ok).toBe(true);
    // Keep-for-later parks the item out of the open triage list (kept list).
    const list = await inboxListKept(rt);
    expect(list.ok).toBe(true);
    if (list.ok) {
      expect(list.data.items.some((i) => i.description === marker)).toBe(true);
    }
    const open = await inboxListOpen(rt);
    if (open.ok) {
      expect(open.data.items.some((i) => i.description === marker)).toBe(false);
    }
    boot.session.close();
  });

  it('T025 SC-H01: item present after 3× close/reopen of app-data DB', async () => {
    for (let trial = 1; trial <= 3; trial++) {
      const boot = await bootstrapNodeSqlite(dbPath);
      expect(boot.created).toBe(false);
      const rt = makeRt(boot.session, dbPath);
      const list = await inboxListKept(rt);
      expect(list.ok).toBe(true);
      if (list.ok) {
        expect(list.data.items.some((i) => i.description === marker)).toBe(true);
      }
      boot.session.close();
    }
    expect(existsSync(dbPath)).toBe(true);
  });

  it('T041 SC-H07: in-app capture succeeds while shortcut registration failed', async () => {
    const boot = await bootstrapNodeSqlite(dbPath);
    const rt = makeRt(boot.session, dbPath);
    expect(rt.globalShortcutRegistered).toBe(false);
    expect(rt.globalShortcutError).toBeTruthy();
    const cap = await inboxCapture(rt, `SC-H07 while shortcut denied ${Date.now()}`);
    expect(cap.ok).toBe(true);
    boot.session.close();
  });

  it('T044 FR-022: Enter-to-submit keyboard handlers in Inbox + QuickCapture', () => {
    const root = join(import.meta.dirname, '../../../apps/desktop/src/features/inbox');
    const inboxSrc = readFileSync(join(root, 'InboxPage.tsx'), 'utf8');
    const quickSrc = readFileSync(join(root, 'QuickCapture.tsx'), 'utf8');
    expect(inboxSrc).toMatch(/e\.key === ['"]Enter['"]/);
    expect(inboxSrc).toContain('requestSubmit');
    expect(inboxSrc).toContain('Keep for later'); // keyboard triage keys documented in the lede
    expect(quickSrc).toMatch(/e\.key === ['"]Enter['"]/);
    expect(quickSrc).toContain('requestSubmit');
  });
});
