# LOS (Lead OS)

Local-first desktop workspace for engineering leads. Offline by default; no account, cloud, Jira, Confluence, or LLM required for the foundational workspace.

## Packages

| Package | Role |
|---------|------|
| `packages/domain` | Pure TypeScript domain rules (no UI/DB) |
| `packages/persistence` | Schema-versioned JSON store + repository adapters (`migrations/001_init.sql` documents the SQLite target shape) |
| `packages/app-services` | Command/query orchestration |
| `apps/desktop` | Tauri 2 + React UI (macOS-first) |

## Develop

```bash
export PATH="$HOME/.local/bin:$PATH"   # if pnpm installed to ~/.local
pnpm install
pnpm test
pnpm --filter @los/desktop dev        # Vite UI (localStorage DB key los-db-v1)
pnpm --filter @los/desktop tauri:dev  # desktop shell (tray + global shortcut)
```

## Database location

| Runtime | Path |
|---------|------|
| Vite / browser | `localStorage` key `los-db-v1` |
| Node helpers / tests | `~/.local/share/los/los-db.json` (via `openDb`) |
| Tauri (intended) | `$APP_DATA/los/los-db.json` |

Backup: Settings → Export, or copy the JSON file while the app is quit. Restore: Settings → Import, or replace the file and relaunch. Automated smoke: `pnpm --filter @los/persistence test` (`backup_restore.test.ts`).

## Spec Kit

Active feature: `specs/001-foundation-workspace/` (see `spec.md`, `plan.md`, `tasks.md`).
