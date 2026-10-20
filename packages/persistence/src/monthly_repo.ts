import type { MemoryStore } from './memory_store.js';
import { createRepos } from './repos.js';

export function createMonthlyRepo(store: MemoryStore) {
  return createRepos(store).monthly;
}
