import type { WorkspaceRuntime } from '@los/app-services';
import {
  createSqliteRepos,
  MemoryStore,
  MIGRATION_SCRIPTS,
  migrateWithScripts,
  tryLegacyImport,
  type LosDbSnapshot,
  type DbSession,
  DbError,
} from '@los/persistence';
import { createTauriSqlSession } from './tauriSqlAdapter';

const STORAGE_KEY = 'los-db-v1';

export type BootNotice = {
  kind: 'legacy' | 'error' | 'info';
  text: string;
};

export type BootResult =
  | { ok: true; rt: WorkspaceRuntime; notices: BootNotice[] }
  | { ok: false; error: { code: string; message: string; dbPath?: string }; notices: BootNotice[] };

function loadSnapshot(): LosDbSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LosDbSnapshot;
    if (!data.version || !Array.isArray(data.applications) || data.applications.length !== 4) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveSnapshot(store: MemoryStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store.data));
}

/** Vite-only preview: labeled non-durable MemoryStore (not SC-H01). */
export function createPreviewRuntime(caps?: {
  trayAvailable?: boolean;
  globalShortcutAvailable?: boolean;
  globalShortcutRegistered?: boolean;
  globalShortcutError?: string;
}): WorkspaceRuntime {
  const existing = loadSnapshot();
  const store = existing ? new MemoryStore(existing) : new MemoryStore();
  if (!existing) saveSnapshot(store);
  return {
    store,
    withTransaction: async <T>(fn: () => Promise<T>) => fn(),
    persist: () => saveSnapshot(store),
    dbReady: true,
    dbPath: 'localStorage:los-db-v1 (preview — non-durable)',
    trayAvailable: caps?.trayAvailable ?? false,
    globalShortcutAvailable: caps?.globalShortcutAvailable ?? false,
    globalShortcutRegistered: caps?.globalShortcutRegistered ?? false,
    globalShortcutError: caps?.globalShortcutError,
  };
}

/** @deprecated use createPreviewRuntime */
export const createBrowserRuntime = createPreviewRuntime;

export function exportDbJson(rt: WorkspaceRuntime): string {
  if (!rt.store) throw new Error('JSON export is only available in Vite preview mode');
  return JSON.stringify(rt.store.data, null, 2);
}

export function importDbJson(rt: WorkspaceRuntime, json: string): void {
  if (!rt.store) throw new Error('JSON import is only available in Vite preview mode');
  const data = JSON.parse(json) as LosDbSnapshot;
  if (!data.version || !Array.isArray(data.applications) || data.applications.length !== 4) {
    throw new Error('Invalid LOS database JSON');
  }
  rt.store.replace(data);
  rt.persist?.();
}

function isTauri(): boolean {
  return Boolean(typeof window !== 'undefined' && window.__TAURI__);
}

/**
 * Durable Tauri runtime: plugin-sql DbSession + shared migrate/repos.
 */
export async function createTauriRuntime(caps?: {
  trayAvailable?: boolean;
  globalShortcutAvailable?: boolean;
  globalShortcutRegistered?: boolean;
  globalShortcutError?: string;
}): Promise<BootResult> {
  const { invoke } = await import('@tauri-apps/api/core');
  const notices: BootNotice[] = [];

  type BootPayload = {
    ok: boolean;
    dbPath?: string;
    sqliteUrl?: string;
    created?: boolean;
    error?: { code: string; message: string };
  };

  let boot: BootPayload;
  try {
    boot = await invoke<BootPayload>('db_bootstrap');
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'DB_OPEN_FAILED',
        message: e instanceof Error ? e.message : String(e),
      },
      notices,
    };
  }

  if (!boot.ok || !boot.dbPath || !boot.sqliteUrl) {
    return {
      ok: false,
      error: {
        code: boot.error?.code ?? 'DB_OPEN_FAILED',
        message: boot.error?.message ?? 'Database bootstrap failed',
        dbPath: boot.dbPath,
      },
      notices,
    };
  }

  let session: (DbSession & { close: () => Promise<void> }) | null = null;
  try {
    session = await createTauriSqlSession(boot.sqliteUrl);
    const { migratedTo } = await migrateWithScripts(session, MIGRATION_SCRIPTS);
    void migratedTo;

    if (boot.created) {
      const legacy = await tryLegacyImport(session, loadSnapshot());
      notices.push({ kind: 'legacy', text: legacy.notice });
    }

    const sqliteRepos = createSqliteRepos(session);
    let closed = false;
    const rt: WorkspaceRuntime = {
      sqliteRepos,
      withTransaction: (fn) => session!.withTransaction(fn),
      dbPath: boot.dbPath,
      dbReady: true,
      trayAvailable: caps?.trayAvailable ?? true,
      globalShortcutAvailable: caps?.globalShortcutAvailable ?? true,
      globalShortcutRegistered: caps?.globalShortcutRegistered ?? false,
      globalShortcutError: caps?.globalShortcutError,
      closeDb: async () => {
        if (!closed) {
          closed = true;
          await session!.close();
        }
      },
    };
    return { ok: true, rt, notices };
  } catch (e) {
    if (session) {
      try {
        await session.close();
      } catch {
        /* ignore */
      }
    }
    const code = e instanceof DbError ? e.code : 'DB_MIGRATE_FAILED';
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: { code, message, dbPath: boot.dbPath },
      notices,
    };
  }
}

export async function bootWorkspaceRuntime(caps?: {
  trayAvailable?: boolean;
  globalShortcutAvailable?: boolean;
  globalShortcutRegistered?: boolean;
  globalShortcutError?: string;
}): Promise<BootResult> {
  if (isTauri()) return createTauriRuntime(caps);
  return {
    ok: true,
    rt: createPreviewRuntime(caps),
    notices: [
      {
        kind: 'info',
        text: 'Vite preview: non-durable localStorage (not SC-H01). Use tauri:dev for SQLite.',
      },
    ],
  };
}
