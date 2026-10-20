# Pre-remediation inventory (002)

**Date**: 2026-10-19  
**Purpose**: Document persistence paths before SQLite hardening (T001).

| Path | Role before 002 |
|------|-----------------|
| `apps/desktop/src/lib/runtime.ts` | Always `createBrowserRuntime` → `localStorage` key `los-db-v1` (`MemoryStore` JSON snapshot) |
| `packages/persistence/src/file_store.ts` | Node JSON read/write + backup/restore helpers (`los-db.json`) |
| `packages/persistence/src/db.ts` | Opens `~/.local/share/los/los-db.json` via `file_store` |
| `packages/persistence/src/memory_store.ts` + `repos.ts` | In-memory durable shape used by app-services |
| `packages/persistence/migrations/001_init.sql` | Documented SQLite schema; **not applied at runtime** |
| `apps/desktop/src-tauri/` | Tray + hardcoded shortcut + `workspace_status`; **no SQL plugin / app-data SQLite** |

**Gap**: Packaged/Tauri-dev claimed durability was not backed by `$APP_DATA/los/los.sqlite`.
