import type { MemoryStore } from './memory_store.js';
import { createRepos } from './repos.js';

export function createActionsRepo(store: MemoryStore) {
  return createRepos(store).actions;
}
