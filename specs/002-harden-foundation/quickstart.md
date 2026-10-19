# Quickstart Validation: Harden Foundation

**Feature**: `002-harden-foundation`  
**Purpose**: Runnable validation after implementation (not a substitute for `tasks.md`).

## Prerequisites

- Branch `feature/002-harden-foundation`
- macOS + Rust + pnpm for Tauri
- Airplane mode / network off for offline trials
- Read [spec.md](./spec.md) clarifications and [data-model.md](./data-model.md)

## Setup

```bash
export PATH="$HOME/.local/bin:$PATH:$HOME/.cargo/bin"
pnpm install
pnpm lint
pnpm test
pnpm --filter @los/desktop build
(cd apps/desktop/src-tauri && cargo check)
pnpm --filter @los/desktop tauri:dev   # durable path — required for SC-H01
```

Vite-only `pnpm --filter @los/desktop dev` is **preview only** (labeled non-durable); do not use it for relaunch/backup acceptance.

## Automated checks

```bash
pnpm --filter @los/persistence test   # migrations, corrupt_open, daily_transaction, backup_restore, legacy_import
pnpm --filter @los/domain test
pnpm --filter @los/app-services test
pnpm lint                             # must pass (SC-H05)
```

Expected: migrate+seed 4 apps; corrupt file checksum unchanged; daily rollback test; SQLite backup restore returns known inbox item; restore of newer-schema backup returns `DB_SCHEMA_TOO_NEW` without clobbering live DB.

**Runtime note**: Vitest uses `better-sqlite3`; Tauri-dev uses `tauri-plugin-sql` + same migrations/repos (see plan Runtime Composition).

## Manual / recorded smokes (write `checklists/verification-evidence.md`)

1. **Relaunch persistence (SC-H01)** — Tauri-dev, offline: capture → quit → relaunch ×3; item present.
2. **Corrupt open (SC-H04)** — Invalid bytes at DB path → launch → error UI; file size/checksum unchanged.
3. **Legacy import** — With no SQLite + valid localStorage/JSON: notice on success/fail; data present if success.
4. **Daily atomicity** — Covered by automated transaction test; optional UI smoke.
5. **Backup/restore** — Settings export + in-app restore; and quit-and-replace path from README.
6. **Fortnight completed** — Select action → complete → still listed on plan.
7. **Shortcut** — Change accel in Settings → immediate re-register or status error; in-app capture still works.
8. **Tray** — Open workspace + quick capture (or skip with OS reason).
9. **Keyboard (FR-022)** — Tab/Enter capture → triage → actions.
10. **Scope** — No Jira/Confluence/LLM required.

## DB path

Documented in root `README.md` / `apps/desktop/README.md` after implement (app-data `los/los.sqlite`). Contracts: [desktop-bridge.md](./contracts/desktop-bridge.md).

**Single-writer**: One app instance writes the DB. Do not run two writers against the same file. If open fails (lock/corrupt), the file is left unchanged (`DB_OPEN_FAILED`).

## Evidence rule

Do not mark tasks complete or claim SC pass without a recorded command/smoke row.
