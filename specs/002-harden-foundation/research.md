# Research: Harden Foundation Persistence & Acceptance

**Feature**: `002-harden-foundation`  
**Date**: 2026-10-19  
**Status**: Phase 0 complete (clarifications resolved; no NEEDS CLARIFICATION remain)

## R1. SQLite runtime split (composition — analyze I1)

**Decision**: One persistence **port** (`DbSession` + repos). Shared `migrations/*.sql`.

| Environment | Driver | Who runs app-services |
|-------------|--------|------------------------|
| Vitest / Node | `better-sqlite3` via `node_sqlite.ts` | Same TS app-services + `sqlite_repos` |
| Tauri-dev / packaged | `tauri-plugin-sql` via `tauriSqlAdapter.ts` on `$APP_DATA/los/los.sqlite` | Same TS app-services in webview after bootstrap |
| Vite-only preview | No SQLite; labeled `MemoryStore` (or equivalent) | Preview only; not acceptance |

Rust/plugin responsibilities: create/open DB file path, run/ensure migrations at startup, shortcut/OS, export/restore file replace (close connection). **Do not** reimplement domain rules in Rust.

**Rationale**: Domain/app-services stay TypeScript-testable and identical on desktop; packaged app gets a real file DB. Matches 001 plan R2 and constitution VI.

**Alternatives considered**:
- **rusqlite-only in Rust**: Forces reimplementing orchestration in Rust. Rejected for remediation scope.
- **sql.js in webview + Tauri fs**: Weaker file locking. Rejected vs plugin-sql.
- **JSON file in app-data**: Fails constitution/plan SQLite + transactions. Rejected.
- **Invoke every CRUD to Rust**: Duplicate business logic. Rejected in favor of shared TS + `DbSession`.

## R2. Migration runner

**Decision**: Apply numbered SQL migrations in order inside a transaction per migration (or begin/commit around apply + version insert). Record versions in `schema_migrations`. Refuse to serve workspace commands if migrate fails. Never delete the DB file on failure.

**Rationale**: Constitution VII; FR-H02; SC-H04.

## R3. Corrupt / invalid open

**Decision**: If file exists but cannot open/validate, return `DB_OPEN_FAILED` (or equivalent); leave bytes unchanged; UI shows blocking recoverable error with path + backup instructions. Seed new DB only when file is absent.

**Rationale**: Audit P0; FR-H04; clarification session (no silent reseed).

## R4. Legacy import (clarified)

**Decision**: When SQLite file absent, attempt one-time auto-import from valid `localStorage`/`los-db-v1` or documented JSON snapshot; show success/failure notice; never import over existing SQLite; never delete legacy source on failure.

**Rationale**: Clarification Q1 → B.

## R5. Transactions for daily upsert

**Decision**: `BEGIN` … materialize actions + save review … `COMMIT`; on error `ROLLBACK`. Test with injected failure after action insert.

**Rationale**: FR-H03; SC-H03.

## R6. Backup / restore (clarified)

**Decision**: Backup = copy of live `los.sqlite` (Settings export and/or documented path). Restore = (a) quit-and-replace file, (b) in-app Settings restore that closes DB, replaces file, reopens/migrates, reloads UI.

**Rationale**: Clarification Q3 → B; FR-H05.

## R7. Shortcut registration (clarified)

**Decision**: On Settings save of accelerator/enabled, invoke immediate unregister/register; emit capability status; never block inbox capture.

**Rationale**: Clarification Q2 → A; FR-H09.

## R8. Preview vs durable (clarified)

**Decision**: Vite-only preview may use labeled non-durable storage. Tauri-dev/packaged must use SQLite. SC-H01/FR-023 evidence only from Tauri paths.

**Rationale**: Clarification Q4 → A.

## R9. Lint

**Decision**: Fix package `tsconfig` so tests are typechecked without `rootDir` conflict (e.g. remove `rootDir` or use project references / separate `tsconfig.tests.json` referenced by lint script).

**Rationale**: FR-H10; SC-H05.

## R10. Fortnight completed selections

**Decision**: Fortnight UI loads actions by `selectedActionIds` including `done`; display status; do not filter to open-only for the selection list.

**Rationale**: FR-H08; 001 edge case.

## Migration risks

| Source | Risk | Mitigation |
|--------|------|------------|
| localStorage / JSON | Lost if skipped; corrupted if bad import | Auto-import only if absent SQLite + valid; notice; preserve sources |
| Partial migrate | Unusable schema | Transactional migrate; refuse start; keep file |
| In-app restore while open | File lock / half-open | Close connection before replace; reopen + migrate |
| Newer-schema backup | Partial open | Refuse with `DB_SCHEMA_TOO_NEW`; automated test required (analyze C1) |

## Out of scope

- Cloud backup, encryption productization, multi-writer sync
- Weakening constitution or editing 001 product spec to match old incomplete code
- Full GUI DB repair wizard
