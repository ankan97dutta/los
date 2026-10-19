import { MemoryStore, type LosDbSnapshot } from '@los/persistence';
import type { WorkspaceRuntime } from '@los/app-services';

const STORAGE_KEY = 'los-db-v1';

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

export function createBrowserRuntime(caps?: {
  trayAvailable?: boolean;
  globalShortcutAvailable?: boolean;
  globalShortcutRegistered?: boolean;
}): WorkspaceRuntime {
  const existing = loadSnapshot();
  const store = existing ? new MemoryStore(existing) : new MemoryStore();
  if (!existing) saveSnapshot(store);
  return {
    store,
    persist: () => saveSnapshot(store),
    trayAvailable: caps?.trayAvailable ?? false,
    globalShortcutAvailable: caps?.globalShortcutAvailable ?? false,
    globalShortcutRegistered: caps?.globalShortcutRegistered ?? false,
  };
}

export function exportDbJson(rt: WorkspaceRuntime): string {
  return JSON.stringify(rt.store.data, null, 2);
}

export function importDbJson(rt: WorkspaceRuntime, json: string): void {
  const data = JSON.parse(json) as LosDbSnapshot;
  if (!data.version || !Array.isArray(data.applications) || data.applications.length !== 4) {
    throw new Error('Invalid LOS database JSON');
  }
  rt.store.replace(data);
  rt.persist?.();
}
