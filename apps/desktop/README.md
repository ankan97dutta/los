# LOS Desktop

React + Vite UI with optional Tauri 2 shell (tray, global shortcut, main window).

## Database location (FR-023)

| Runtime | Location |
|---------|----------|
| Vite / webview without native FS bridge | Browser `localStorage` key **`los-db-v1`** |
| Node / persistence helpers | `~/.local/share/los/los-db.json` |
| Packaged Tauri (document for operators) | **`$APP_DATA/los/los-db.json`** (macOS: `~/Library/Application Support/com.los.desktop/los/los-db.json`) |

Schema version is embedded in the JSON snapshot (`version: 1`). First launch seeds four applications and default workspace settings (also described in `packages/persistence/migrations/001_init.sql`).

### Backup

1. Quit the app (or use Settings → Export DB).
2. Copy `los-db.json` (or the exported JSON) to a safe location.

### Restore

1. Quit the app.
2. Replace the DB file with the backup **or** use Settings → Import / restore.
3. Relaunch and confirm data (e.g. known inbox item).

Automated: `packages/persistence/tests/backup_restore.test.ts`.

## Scripts

```bash
pnpm --filter @los/desktop dev         # UI only
pnpm --filter @los/desktop tauri:dev   # Tauri + Vite
pnpm --filter @los/desktop build       # production web assets
```

Cold start opens the main window with no account or network requirement. Inbox capture remains available in-app when tray/shortcut registration fails.
