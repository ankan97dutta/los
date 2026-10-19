# Implementation Plan: Harden Foundation Persistence & Acceptance

**Branch**: `feature/002-harden-foundation` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Remediation specification from `/specs/002-harden-foundation/spec.md`  
**Baseline**: `specs/001-foundation-workspace/` + constitution + foundation audit (do not weaken)

## Summary

Close audit P0/P1 gaps so the existing foundation product meets constitution and 001 acceptance: durable **SQLite** in Tauri app-data, **versioned migrations**, **transactions** for multi-entity daily saves, **no silent data loss**, real-file **backup/restore**, finished **Tauri DB bootstrap/handlers**, fortnight **completed selections**, **settings-driven shortcuts**, **lint** green, and **honest verification evidence**. No new unrelated product features.

## Technical Context

**Language/Version**: TypeScript 5.x (domain, persistence, UI); Rust stable (Tauri shell)

**Primary Dependencies**: Existing Tauri 2 + React + Vitest monorepo; SQLite via persistence adapter (Tauri SQL plugin and/or rusqlite—choose one in implementation; domain stays SQL-free)

**Package manager**: pnpm workspaces

**Storage**: SQLite file under Tauri app-data (`$APP_DATA/los/los.sqlite` or equivalent documented path); legacy JSON/localStorage import-only

**Testing**: Vitest for migrations, transactions, corrupt-open, backup/restore; scripted/manual desktop smoke evidence for tray/shortcut/keyboard/relaunch

**Target Platform**: macOS-first (same as 001)

**Project Type**: Desktop remediation on existing monorepo

**Performance Goals**: Unchanged from 001 (cold capture &lt; 30s; autosave responsive)

**Constraints**: Offline core; no account/cloud/LLM/Jira/Confluence; no silent discard; no constitution/001-spec weakening

**Scale/Scope**: Single-user local DB; migrate prototype users once

## Constitution Check

| Gate | Plan disposition |
|------|------------------|
| Offline core | Pass — SQLite local only |
| No LLM required | Pass — unchanged |
| Privacy default | Pass — no new outbound paths |
| Adapter isolation | Pass — N/A integrations |
| Ownership clarity | Pass — LOS-owned data |
| Modular boundaries | Pass — domain remains pure; SQLite only in persistence/Tauri bridge |
| Migration safety | Pass — versioned migrations + backup/restore smoke + corrupt-open preservation |
| Test evidence | Pass — automated persistence tests + recorded desktop verification |
| Spec completeness | Pass — this feature’s spec/plan/tasks + baseline 001 |
| Desktop UX | Pass — tray/shortcut honesty + keyboard verification recorded |

**Post-design re-check**: Remediates prior constitution VII/IX gaps; no new violations intended.

## Project Structure

### Documentation (this feature)

```text
specs/002-harden-foundation/
├── plan.md
├── research.md
├── spec.md
├── quickstart.md
├── tasks.md
├── contracts/           # deltas vs 001 contracts if any
└── checklists/
```

### Source Code (touch set — incremental)

```text
packages/persistence/          # SQLite adapter, migrations runner, transactions
packages/persistence/migrations/
packages/app-services/         # transactional daily upsert orchestration
packages/domain/               # tsconfig lint fix only if needed
apps/desktop/src/              # remove durable localStorage path; invoke bridge
apps/desktop/src-tauri/        # DB path, migrate on startup, commands, shortcuts from settings
apps/desktop/README.md         # real path + backup
specs/001-foundation-workspace/tasks.md   # reconcile checkboxes / notes (honesty)
specs/002-harden-foundation/checklists/   # verification evidence
```

**Structure Decision**: Keep 001 package boundaries; replace persistence implementation behind ports; wire Tauri to that store.

## Complexity Tracking

| Violation / debt | Why needed | Simpler alternative rejected |
|------------------|------------|------------------------------|
| Optional legacy import | Prototype users may have localStorage data | Drop all legacy data without import path — higher silent loss risk |
| Dual preview vs packaged storage messaging | Vite preview cannot use Tauri app-data | Force SQLite in browser via sql.js only — possible later, not required if preview clearly non-durable |

## Finding → requirement map

| Audit finding | Spec | Plan phase |
|---------------|------|------------|
| P0 no SQLite/migrations/transactions | FR-H01–H03 | Foundational + US1–US2 |
| P0 silent reseed | FR-H04 | US1 |
| P0 app-data unused | FR-H01, FR-H06–H07 | US1 + Tauri |
| P1 unfinished T013–T016/T020 | FR-H07 | Foundational + US1 |
| P1 non-atomic daily | FR-H03 | US2 |
| P1 fortnight completed | FR-H08 | US4 |
| P1 shortcut settings | FR-H09 | US5 |
| P1 lint | FR-H10 | Polish |
| P1 overclaimed evidence / tasks | FR-H11–H12 | US6 |
| P2 CSP / re-exports | Out of scope unless blocking | Skip unless needed |
