import { homedir } from 'node:os';
import { join } from 'node:path';
import { loadOrCreateStore, persistStore } from './file_store.js';
import type { MemoryStore } from './memory_store.js';

/** Default local DB path (Node/tests). Tauri uses app data dir instead. */
export function defaultDbPath(): string {
  return join(homedir(), '.local', 'share', 'los', 'los-db.json');
}

export function openDb(dbPath: string = defaultDbPath()): {
  store: MemoryStore;
  persist: () => void;
  dbPath: string;
} {
  const store = loadOrCreateStore(dbPath);
  return {
    store,
    persist: () => persistStore(dbPath, store),
    dbPath,
  };
}
