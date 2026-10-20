import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createEmptySnapshot, LosDbSnapshot, MemoryStore } from './memory_store.js';

export function loadOrCreateStore(dbPath: string): MemoryStore {
  if (!existsSync(dbPath)) {
    const store = new MemoryStore(createEmptySnapshot());
    persistStore(dbPath, store);
    return store;
  }
  const raw = readFileSync(dbPath, 'utf8');
  const data = JSON.parse(raw) as LosDbSnapshot;
  if (!data.version || !Array.isArray(data.applications) || data.applications.length !== 4) {
    throw new Error('Invalid LOS database file');
  }
  return new MemoryStore(data);
}

export function persistStore(dbPath: string, store: MemoryStore): void {
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(store.data, null, 2), 'utf8');
}

export function backupDbFile(dbPath: string, backupPath: string): void {
  copyFileSync(dbPath, backupPath);
}

export function restoreDbFile(backupPath: string, dbPath: string): void {
  copyFileSync(backupPath, dbPath);
}
