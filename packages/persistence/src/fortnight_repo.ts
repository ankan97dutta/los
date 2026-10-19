import type { MemoryStore } from './memory_store.js';
import { createRepos } from './repos.js';

export function createFortnightRepo(store: MemoryStore) {
  return createRepos(store).fortnight;
}
