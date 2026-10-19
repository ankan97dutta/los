import type { MemoryStore } from './memory_store.js';
import { createRepos } from './repos.js';

export function createInboxRepo(store: MemoryStore) {
  return createRepos(store).inbox;
}
