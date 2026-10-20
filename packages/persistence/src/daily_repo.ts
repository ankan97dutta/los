import type { MemoryStore } from './memory_store.js';
import { createRepos } from './repos.js';

export function createDailyRepo(store: MemoryStore) {
  return createRepos(store).daily;
}
