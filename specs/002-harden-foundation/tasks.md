# Tasks: Harden Foundation Persistence & Acceptance

**Input**: Design documents from `/specs/002-harden-foundation/`  
**Prerequisites**: spec.md, plan.md, research.md  
**Baseline findings**: foundation audit P0/P1 · constitution VII–IX · 001 FR/SC as cited per task  
**Rule**: Never mark `[X]` without verification evidence (command output or checklist row).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup & honesty baseline

**Purpose**: Align docs/tasks with reality before coding persistence

- [ ] T001 Inventory current persistence paths (`apps/desktop/src/lib/runtime.ts`, `packages/persistence/src/file_store.ts`, Tauri app-data) and record gaps in `specs/002-harden-foundation/checklists/pre-remediation-inventory.md` (**Audit P0 path mismatch**)
- [ ] T002 [P] Correct overclaimed rows in `specs/001-foundation-workspace/checklists/implementation-evidence.md` (mark unverified/compile-only) and add pointer to 002 evidence (**Audit P1 evidence · FR-H12**)
- [ ] T003 [P] Reconcile `specs/001-foundation-workspace/tasks.md`: uncheck or annotate T013–T016, T020 and any other SQLite/Tauri items not actually done (**Audit P1 tasks · FR-H12 · Const. IX**)
- [ ] T004 Fix domain/persistence TypeScript lint (`rootDir` vs `tests`) so `pnpm lint` passes; record output in evidence (**Audit P1 lint · FR-H10 · SC-H05**)

---

## Phase 2: Foundational SQLite + migrations (blocking)

**Purpose**: Durable DB primitives before UI stories

**⚠️ CRITICAL**: No US1–US5 completion until migrate/open/transaction primitives exist and tests fail-then-pass

- [ ] T005 Add SQLite driver/adapter dependency and connection bootstrap API in `packages/persistence/src/db.ts` (app-data path injectable for tests) (**FR-H01 · Audit P0 · 001 plan R2**)
- [ ] T006 Implement versioned migration runner executing `packages/persistence/migrations/*.sql` with applied-version recording in `packages/persistence/src/migrate.ts` (**FR-H02 · Const. VII**)
- [ ] T007 Ensure `001_init.sql` (or successor) creates all 001 entities + seeds four applications + settings; add Vitest that empty DB migrates and seeds exactly four apps in `packages/persistence/tests/migrations.test.ts` (**FR-H01 · 001 FR-007**)
- [ ] T008 Implement transactional helper (`withTransaction`) in `packages/persistence/src/db.ts` used by multi-entity writes (**FR-H03**)
- [ ] T009 [P] Implement corrupt/invalid open behavior: preserve file bytes, return explicit error, never reseed-overwrite in `packages/persistence/src/db.ts` + test `packages/persistence/tests/corrupt_open.test.ts` (**FR-H04 · SC-H04 · Audit P0 silent wipe**)
- [ ] T010 Replace in-memory/JSON repository implementations with SQLite-backed repos in `packages/persistence/src/repos.ts` (keep port shapes from `@los/domain`) (**FR-H01**)
- [ ] T011 [P] One-time auto legacy import when DB file absent + valid JSON/localStorage; success/failure notice; never import over existing DB — `packages/persistence/src/legacy_import.ts` + tests + UI notice (**FR-H14 · clarification · research R4**)

**Checkpoint**: Persistence package can migrate, open safely, refuse corrupt overwrite, and CRUD via SQLite in Vitest

---

## Phase 3: User Story 1 — Durable desktop DB (P1) 🎯 MVP

**Goal**: Tauri app uses app-data SQLite across relaunch  
**Independent Test**: SC-H01 offline quit/relaunch capture

- [ ] T012 [US1] Wire Tauri startup to resolve app-data DB path, run migrations, hold connection in `apps/desktop/src-tauri/src/` (**FR-H07 · Audit T016**)
- [ ] T013 [US1] Expose Tauri invoke handlers for workspace commands/queries per `specs/001-foundation-workspace/contracts/` in `apps/desktop/src-tauri/` + thin clients in `apps/desktop/src/lib/api.ts` (**FR-H07 · Audit T020**)
- [ ] T014 [US1] Split runtimes in `apps/desktop/src/lib/runtime.ts`: Tauri → SQLite bridge; Vite-only → labeled non-durable preview (not valid for SC-H01) (**FR-H01 · clarification · Audit P0**)
- [ ] T015 [US1] Update `apps/desktop/README.md` + Settings copy with real SQLite path and backup steps (**FR-H06**)
- [ ] T016 [US1] Record relaunch persistence verification (3 trials) in `specs/002-harden-foundation/checklists/verification-evidence.md` (**SC-H01 · FR-H11**)

**Checkpoint**: Packaged/tauri-dev persist path is SQLite app-data

---

## Phase 4: User Story 2 — Daily transactional save (P1)

**Goal**: daily upsert atomic with next-action materialization  
**Independent Test**: SC-H03

- [ ] T017 [US2] Wrap `dailyUpsert` action+review writes in `withTransaction` in `packages/app-services/src/workspace.ts` (or `daily.ts`) (**FR-H03 · Audit P1**)
- [ ] T018 [US2] Add failing-then-passing test simulating mid-operation error → rollback in `packages/persistence/tests/daily_transaction.test.ts` or app-services tests (**SC-H03**)

**Checkpoint**: No half-applied daily materialization

---

## Phase 5: User Story 3 — Backup/restore real file (P1)

**Goal**: FR-023 against SQLite file  
**Independent Test**: SC-H02

- [ ] T019 [US3] Implement/adjust backup+restore helpers for SQLite file paths in `packages/persistence/src/` (**FR-H05**)
- [ ] T020 [US3] Rewrite `packages/persistence/tests/backup_restore.test.ts` to use SQLite seed → copy → mutate → restore → assert inbox item (**FR-H05 · SC-H02 · 001 FR-023**)
- [ ] T021 [US3] Settings export + in-app restore (close/replace/reopen) and document quit-and-replace in `apps/desktop/src/features/settings/SettingsPage.tsx` + README (**FR-H05–H06 · clarification**)

**Checkpoint**: Automated restore smoke green on SQLite

---

## Phase 6: User Story 4 — Fortnight completed selections (P2)

**Goal**: Historical selections visible when actions done  
**Independent Test**: SC-H06

- [ ] T022 [US4] Load selected actions by ID (including completed) in fortnight UI `apps/desktop/src/features/reviews/FortnightPlanPage.tsx` (**FR-H08 · Audit P1 · 001 edge case**)
- [ ] T023 [P] [US4] Add test or scripted assertion that selection retained after `actions.setStatus(done)` in domain/app-services or persistence tests (**SC-H06**)

**Checkpoint**: Completed selected work remains on plan

---

## Phase 7: User Story 5 — Settings-driven shortcut (P2)

**Goal**: OS registration uses settings; failures surfaced  
**Independent Test**: SC-H07

- [ ] T024 [US5] Register global shortcut from WorkspaceSettings in `apps/desktop/src-tauri/src/shortcuts.rs` (remove hard-coded-only path) (**FR-H09 · Audit P1**)
- [ ] T025 [US5] On explicit Settings save of accelerator/enabled, immediately call `shortcuts.reregister`; emit `los:caps` with failure details (**FR-H09 · clarification · 001 FR-021**)
- [ ] T026 [US5] Ensure `LocalStatus` shows shortcut registered/failed from capabilities events in `apps/desktop/src/features/status/LocalStatus.tsx` (**FR-H09 · SC-H07**)

**Checkpoint**: Denied shortcut still allows in-app capture + visible status

---

## Phase 8: User Story 6 — Verification & evidence (P2)

**Goal**: Honest gates for offline, tray, shortcut, keyboard, lint  
**Independent Test**: SC-H05, SC-H08, SC-H09

- [ ] T027 [US6] Execute offline core smoke (capture/triage/actions/reviews) and record in `specs/002-harden-foundation/checklists/verification-evidence.md` (**FR-H11 · 001 SC-004**)
- [ ] T028 [US6] Execute tray open + quick capture smoke (or document OS blocker) in verification evidence (**FR-H11 · 001 US7**)
- [ ] T029 [US6] Execute shortcut success or denial path smoke in verification evidence (**FR-H11 · SC-H07**)
- [ ] T030 [US6] Execute keyboard path smoke (capture → triage → actions) in verification evidence (**FR-H11 · 001 FR-022**)
- [ ] T031 [P] [US6] Confirm no Jira/Confluence/LLM deps in package manifests; record (**FR-H13 · SC-H09**)
- [ ] T032 [US6] Final pass: only mark 002 tasks `[X]` when verified; ensure 001 reconciliation from T002–T003 still accurate (**FR-H12**)

---

## Phase 9: Polish

- [ ] T033 [P] Align `specs/002-harden-foundation/quickstart.md` commands with real scripts
- [ ] T034 Run full `pnpm test && pnpm lint && pnpm --filter @los/desktop build` and `cargo check`; paste summaries into verification evidence (**SC-H05**)

---

## Dependencies

```text
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4–5 (US2–US3 can parallel after T008/T010)
US4, US5 after US1 bridge exists
US6 after relevant behaviors exist (can draft evidence template earlier)
```

## Parallel opportunities

- T002/T003/T004 after T001
- T009/T011 after T005–T006
- T022/T023 parallel with US5 once DB works
- T031 anytime

## Implementation strategy

1. Honesty + lint (Phase 1)  
2. SQLite foundation tests (Phase 2)  
3. Tauri durable path MVP (Phase 3)  
4. Transactions + backup (Phases 4–5)  
5. Fortnight + shortcuts (Phases 6–7)  
6. Recorded verification (Phase 8–9)  

**MVP**: Phases 1–3 + T017–T020 (durable DB, no silent loss, atomic daily, restore smoke)

## Finding cross-index

| Finding / criterion | Tasks |
|---------------------|-------|
| Audit P0 SQLite/migrations | T005–T007, T010, T012 |
| Audit P0 silent wipe | T009, T014 |
| Audit P0 app-data | T012–T015 |
| Audit P1 T013–T016/T020 | T003, T012–T013 |
| Audit P1 daily atomicity | T008, T017–T018 |
| Audit P1 fortnight | T022–T023 |
| Audit P1 shortcut | T024–T026 |
| Audit P1 lint | T004, T034 |
| Audit P1 evidence/tasks | T001–T003, T016, T027–T032 |
| 001 FR-023 / SC-H02 | T019–T021 |
| Const. VII–IX | T006–T009, T032 |
