# LOS Desktop

Tauri 2 + React UI (macOS-first).

## Runtimes

| Mode | Command | Persistence |
|------|---------|-------------|
| Vite preview | `pnpm --filter @los/desktop dev` | **Non-durable** `localStorage` key `los-db-v1` (not SC-H01) |
| Tauri-dev / packaged | `pnpm --filter @los/desktop tauri:dev` | **SQLite** `$APP_DATA/los/los.sqlite` via `tauri-plugin-sql` |

### App-data path

- macOS: `~/Library/Application Support/com.los.desktop/los/los.sqlite` (exact bundle id from `tauri.conf.json`)
- Create `los/` under the OS app-data directory on first bootstrap.

### Single-writer

One LOS instance writes the DB. Do not run two writers against the same file. Locked/corrupt open returns `DB_OPEN_FAILED` and **does not** delete or reseed the file.

### Runtime composition

- Domain + app-services call repository ports / `DbSession` only.
- Node/Vitest: `better-sqlite3` (`packages/persistence` Node adapter).
- Tauri: `apps/desktop/src/lib/tauriSqlAdapter.ts` implements full `DbSession` including `withTransaction`.
- Shared SQL: `packages/persistence/migrations/*.sql`.

### Backup / restore

1. **In-app**: Settings → Export DB / Restore SQLite (closes connection, replaces file, reloads).
2. **Quit-and-replace**: Quit LOS, copy a backup over `los.sqlite`, relaunch (migrations run on open).

Newer-schema backups are refused with `DB_SCHEMA_TOO_NEW` before replacing the live file.
