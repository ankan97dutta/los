# Implementation Plan: Harden Foundation Persistence & Acceptance

**Branch**: `feature/002-harden-foundation` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Clarified feature specification from `/specs/002-harden-foundation/spec.md`  
**Baseline**: `specs/001-foundation-workspace/` + constitution + foundation audit (do not weaken)

## Summary

Remediate the foundation so constitution and 001 acceptance hold on the real desktop path: **SQLite in Tauri app-data**, **versioned migrations**, **transactions** (daily upsert), **no silent data loss**, **dual backup/restore** (quit-and-replace + in-app Settings), finished **Tauri bootstrap/handlers**, **fortnight completed selections**, **immediate settings-driven shortcut re-registration**, **lint green**, and **honest verification**. Vite-only preview may stay labeled non-durable; acceptance is Tauri-dev/packaged only.

## Technical Context

**Language/Version**: TypeScript 5.x (domain, persistence ports, UI, app-services); Rust stable (Tauri 2 shell)

**Primary Dependencies**: Existing monorepo (Tauri 2, React 19, Vitest, pnpm). **SQLite**: shared SQL migrations; Node/Vitest via `better-sqlite3`; Tauri runtime via `tauri-plugin-sql` (SQLite) bound to the same schema files. Domain remains SQL-free.

**Storage**: `$APP_DATA/los/los.sqlite` (exact path documented in README; create `los/` under app data). Not localStorage for durable Tauri runs.

**Testing**: Vitest — migrations, corrupt-open checksum, transactions, backup/restore, legacy import; recorded Tauri-dev smokes for relaunch/tray/shortcut/keyboard

**Target Platform**: macOS-first (tray/shortcut)

**Project Type**: Desktop remediation on existing monorepo

**Performance Goals**: Unchanged from 001 (cold capture &lt; 30s; autosave responsive)

**Constraints**: Offline; no cloud/account/LLM/Jira/Confluence; preserve corrupt DB bytes; clarifications: auto-import+notice, immediate shortcut re-register, dual restore, Vite non-durable OK

**Scale/Scope**: Single-user single-writer SQLite; optional one-time legacy import

## Constitution Check

*GATE: before Phase 0 — pass. Post-design re-check below.*

| Gate | Plan disposition |
|------|------------------|
| Offline core | Pass — local SQLite only |
| No LLM required | Pass |
| Privacy default | Pass — no new outbound paths |
| Adapter isolation | Pass — N/A integrations |
| Ownership clarity | Pass — LOS-owned entities unchanged |
| Modular boundaries | Pass — domain pure; SQL only in persistence + Tauri SQL plugin |
| Migration safety | Pass — versioned SQL migrations; transactional migrate; backup/restore smoke; corrupt-open preserves file |
| Test evidence | Pass — automated persistence + verification-evidence checklist |
| Spec completeness | Pass — clarified 002 + baseline 001 |
| Desktop UX | Pass — shortcut/status honesty; keyboard verification recorded |

**Post-design re-check**: Design closes prior VII/IX gaps (JSON/localStorage, false evidence). Complexity: dual SQLite drivers (Node vs Tauri plugin) justified below.

## Project Structure

### Documentation (this feature)

```text
specs/002-harden-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
└── checklists/
```

### Source Code (touch set)

```text
packages/persistence/
  migrations/                 # authoritative SQL (shared)
  src/db.ts                   # open/migrate/transaction; corrupt-safe open
  src/sqlite_repos.ts         # SQLite repo impl
  src/legacy_import.ts
  src/backup.ts
  tests/
packages/app-services/src/    # dailyUpsert in transaction; settings → shortcut side effects via runtime hooks
apps/desktop/src/lib/         # Tauri invoke clients; preview vs tauri runtime split
apps/desktop/src/features/    # Settings restore/export; Fortnight completed selections; LocalStatus; import notice
apps/desktop/src-tauri/       # plugin-sql, path, migrate on startup, shortcut re-register, commands
apps/desktop/README.md
specs/001-foundation-workspace/tasks.md          # honesty reconcile
specs/001-foundation-workspace/checklists/       # evidence correct
specs/002-harden-foundation/checklists/          # verification-evidence.md
```

**Structure Decision**: Keep 001 package boundaries; swap persistence implementation to SQLite; Tauri owns app-data file lifecycle; UI uses invoke in Tauri mode.

## Complexity Tracking

| Violation / debt | Why needed | Simpler alternative rejected |
|------------------|------------|------------------------------|
| Dual SQLite access (better-sqlite3 in Node + tauri-plugin-sql in app) | Vitest must run migrations/transactions without GUI; webview cannot use better-sqlite3 | All DB only in Rust → larger rewrite of app-services; sql.js-only → weaker desktop file semantics |
| Legacy auto-import | Prototype users have localStorage/JSON | Drop legacy data → silent loss of prototype captures |
| In-app restore while running | Clarification B; FR-H05 | Quit-only restore → weaker UX/acceptance |

## Clarification → design mapping

| Clarification | Design impact |
|---------------|---------------|
| Legacy auto-import + notice | `legacy_import` on first open if DB absent; UI toast/banner |
| Immediate shortcut re-register | Settings save → invoke `shortcuts.reregister` |
| Dual restore | File docs + Settings import/restore command closing/reopening DB |
| Vite non-durable | `createPreviewRuntime` labeled; SC-H01 only on Tauri |
