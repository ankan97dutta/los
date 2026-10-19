# Desktop Bridge Contracts (002)

All results: `{ ok: true, data } | { ok: false, error: { code, message } }` unless noted.

## Lifecycle

### `db.bootstrap`

```ts
Input:  {} // path resolved in Rust from app-data
Output: {
  dbPath: string,
  migratedTo: number,
  legacyImport?: { attempted: boolean, imported: boolean, notice: string }
}
Errors: DB_OPEN_FAILED | DB_MIGRATE_FAILED | LEGACY_IMPORT_FAILED (non-fatal import may still ok:true with imported:false)
```

Called once at Tauri startup before other workspace commands. Corrupt existing file → `ok: false`, file preserved. Locked/busy open that cannot proceed safely → `ok: false` with `DB_OPEN_FAILED` (or equivalent); file bytes unchanged (single-writer / fail-safe; analyze A1).

After bootstrap, webview workspace code uses `DbSession` via `tauriSqlAdapter`, which **MUST** implement `withTransaction` with the same semantics as the Node adapter (analyze L1).

### `workspace.status` (extends 001)

```ts
Output additions:
  dbPath?: string
  dbReady: boolean
  globalShortcutRegistered: boolean
  globalShortcutError?: string
```

## Backup / restore

### `db.exportBackup`

```ts
Input:  { destPath?: string } // or return bytes / path chosen via dialog
Output: { backupPath: string }
Errors: DB_OPEN_FAILED | IO_ERROR
```

### `db.restoreBackup`

```ts
Input:  { sourcePath: string } // or bytes from file picker
Output: { dbPath: string, migratedTo: number }
Errors: DB_OPEN_FAILED | DB_SCHEMA_TOO_NEW | DB_MIGRATE_FAILED | IO_ERROR
```

Semantics: close connection → replace live SQLite → reopen + migrate → ready for commands. UI must reload state after success.

If backup `schema_migrations` max version **greater than** app-supported max, return `DB_SCHEMA_TOO_NEW` **before** replacing the live file (live DB unchanged).

## Shortcuts

### `shortcuts.reregister`

```ts
Input:  { enabled: boolean, accel: string } // from WorkspaceSettings after save
Output: { registered: boolean, error?: string }
```

Called immediately after explicit Settings save of shortcut fields (clarification). Failure does not block core capture; update `workspace.status`.

## 001 commands

`inbox.*`, `actions.*`, `applications.*`, `daily.*`, `fortnight.*`, `monthly.*`, `settings.*` — same as 001 contracts; implementations MUST use SQLite behind the bridge in Tauri mode.
