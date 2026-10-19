# Implementation Plan: Harden Foundation Persistence & Acceptance

**Branch**: `feature/002-harden-foundation` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Clarified feature specification from `/specs/002-harden-foundation/spec.md`  
**Baseline**: `specs/001-foundation-workspace/` + constitution + foundation audit (do not weaken)

## Summary

Remediate the foundation so constitution and 001 acceptance hold on the real desktop path: **SQLite in Tauri app-data**, **versioned migrations**, **transactions** (daily upsert), **no silent data loss**, **dual backup/restore** (quit-and-replace + in-app Settings), finished **Tauri bootstrap/handlers**, **fortnight completed selections**, **immediate settings-driven shortcut re-registration**, **lint green**, and **honest verification**. Vite-only preview may stay labeled non-durable; acceptance is Tauri-dev/packaged only.

## Technical Context

**Language/Version**: TypeScript 5.x (domain, persistence ports, UI, app-services); Rust stable (Tauri 2 shell)

**Primary Dependencies**: Existing monorepo (Tauri 2, React 19, Vitest, pnpm). **SQLite**: shared SQL migrations; dual **drivers behind one persistence port** (see Runtime Composition). Domain remains SQL-free.

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
  migrations/                      # authoritative SQL (shared)
  src/ports.ts                     # DbSession / withTransaction / migrate interfaces
  src/node_sqlite.ts               # better-sqlite3 adapter (Vitest + Node)
  src/sqlite_repos.ts              # repos over DbSession (driver-agnostic)
  src/legacy_import.ts
  src/backup.ts
  tests/
apps/desktop/src/lib/
  tauriSqlAdapter.ts               # DbSession via @tauri-apps/plugin-sql
  api.ts / runtime.ts              # Tauri: app-services + tauri adapter; Vite: labeled preview MemoryStore
apps/desktop/src-tauri/            # plugin-sql init, app-data path, migrate on startup, shortcuts, thin invokes
```

**Structure Decision**: Keep 001 package boundaries. **Runtime Composition (analyze I1 remediation):**

1. **Domain + app-services** stay pure TypeScript and call **repository ports** / `DbSession` only (no driver imports).
2. **Shared** `migrations/*.sql` + `sqlite_repos` implement ports against `DbSession` (`exec` / `query` / `withTransaction`).
3. **Node/Vitest**: `node_sqlite.ts` = `better-sqlite3` implementing `DbSession` (file under temp dir).
4. **Tauri-dev/packaged**: Rust enables `tauri-plugin-sql` on `$APP_DATA/los/los.sqlite`; TypeScript `tauriSqlAdapter.ts` implements the same `DbSession`; UI/bootstrap call `db.bootstrap` then run app-services in the webview against that adapter.
5. **Vite-only preview**: labeled non-durable `MemoryStore` (or equivalent)—**not** SQLite; must not claim SC-H01/FR-023.
6. Thin Tauri **invoke** remains for OS concerns (path, shortcut re-register, file dialogs, restore close/reopen); workspace CRUD may stay in-process TS once `DbSession` is live (invoke only where the plugin requires setup).

## Complexity Tracking

| Violation / debt | Why needed | Simpler alternative rejected |
|------------------|------------|------------------------------|
| Dual SQLite drivers behind one `DbSession` port | Vitest needs Node SQLite; webview uses plugin-sql; app-services stay shared | All DB only in Rust → rewrite orchestration; single driver in webview only → no solid Node Vitest file DB |
| Legacy auto-import | Prototype users have localStorage/JSON | Drop legacy data → silent loss of prototype captures |
| In-app restore while running | Clarification B; FR-H05 | Quit-only restore → weaker UX/acceptance |

## Clarification → design mapping

| Clarification | Design impact |
|---------------|---------------|
| Legacy auto-import + notice | `legacy_import` on first open if DB absent; UI toast/banner |
| Immediate shortcut re-register | Settings save → invoke `shortcuts.reregister` |
| Dual restore | File docs + Settings import/restore command closing/reopening DB |
| Vite non-durable | `createPreviewRuntime` labeled; SC-H01 only on Tauri |

## Analyze remediation (2026-10-19)

| Finding | Disposition |
|---------|-------------|
| I1 Dual SQLite composition | Resolved in Runtime Composition above + research R1 |
| C1 `DB_SCHEMA_TOO_NEW` | Task + test required in tasks.md; refuse restore/open |
| U1 T025 confirm-only | Replaced by wiring/assert task against transactional `dailyUpsert` on Tauri `DbSession` |
