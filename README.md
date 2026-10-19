# LOS (Lead OS)

Local-first desktop workspace for engineering leads. Offline by default; no account, cloud, Jira, Confluence, or LLM required for the foundational workspace.

## Packages

| Package | Role |
|---------|------|
| `packages/domain` | Pure TypeScript domain rules (no UI/DB) |
| `packages/persistence` | SQLite migrations + `DbSession` adapters (`better-sqlite3` Node; shared repos) |
| `packages/app-services` | Command/query orchestration |
| `apps/desktop` | Tauri 2 + React UI (macOS-first) |

## Develop

```bash
export PATH="$HOME/.local/bin:$PATH"   # if pnpm installed to ~/.local
pnpm install
pnpm test
pnpm lint
pnpm --filter @los/desktop dev        # Vite preview (non-durable localStorage)
pnpm --filter @los/desktop tauri:dev  # durable SQLite + tray + global shortcut
```

## Database location

| Runtime | Path |
|---------|------|
| Vite preview | `localStorage` key `los-db-v1` — **non-durable**; not SC-H01 |
| Node / Vitest | temp or helper paths via `better-sqlite3` |
| Tauri-dev / packaged | `$APP_DATA/los/los.sqlite` (macOS: under Application Support for the app id) |

**Single-writer**: one app instance per DB file. Do not run two writers against the same file. Locked/corrupt open fails with `DB_OPEN_FAILED` and leaves file bytes unchanged (no silent reseed).

Backup: Settings → Export (SQLite copy), or copy `los.sqlite` while quit. Restore: Settings → Restore, or quit-and-replace the file then relaunch. Automated: `pnpm --filter @los/persistence test`.

## Spec Kit

Active feature: `specs/003-fortnight-capacity/` (capacity planning). Baselines: `specs/001-foundation-workspace/`, `specs/002-harden-foundation/`.
