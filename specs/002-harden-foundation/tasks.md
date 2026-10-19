# Tasks: Harden Foundation Persistence & Acceptance

**Input**: Design documents from `/specs/002-harden-foundation/`  
**Prerequisites**: plan.md, spec.md (clarified), research.md, data-model.md, contracts/  
**Tests**: Included — spec SC-H02–H04 and FR-H11/H12 require automated persistence tests + recorded verification  
**Rule**: Never mark `[X]` without verification (command output or checklist row)

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Honesty baseline and tooling before SQLite work

- [ ] T001 Create `specs/002-harden-foundation/checklists/pre-remediation-inventory.md` documenting current persistence paths (`apps/desktop/src/lib/runtime.ts`, `packages/persistence/src/file_store.ts`, Tauri app-data gap)
- [ ] T002 [P] Correct overclaimed rows in `specs/001-foundation-workspace/checklists/implementation-evidence.md` and link to 002 verification evidence
- [ ] T003 [P] Reconcile `specs/001-foundation-workspace/tasks.md`: uncheck or annotate unfinished SQLite/Tauri items (e.g. T013–T016, T020)
- [ ] T004 Fix domain/persistence TypeScript lint (`rootDir` vs tests) in `packages/domain/tsconfig.json` and `packages/persistence/tsconfig.json` so `pnpm lint` succeeds
- [ ] T005 Add `better-sqlite3` (+ types) to `packages/persistence/package.json` and `tauri-plugin-sql` to `apps/desktop/src-tauri/Cargo.toml` / Tauri config per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SQLite open/migrate/repos/transactions shared by all stories

**⚠️ CRITICAL**: No user story phase starts until this checkpoint passes

- [ ] T006 Implement corrupt-safe open + app-data path helper in `packages/persistence/src/db.ts` (create DB only if file absent; `DB_OPEN_FAILED` preserves bytes; errors per `data-model.md`)
- [ ] T007 Implement versioned migration runner in `packages/persistence/src/migrate.ts` applying `packages/persistence/migrations/*.sql` with `schema_migrations` version + `applied_at` in a transaction per migration
- [ ] T008 Align `packages/persistence/migrations/001_init.sql` with 001 entities + seed exactly four Applications (`Application 1`–`Application 4`, slotIndex 1..4) and default WorkspaceSettings (`fortnightStartWeekday=mon`)
- [ ] T009 Implement `withTransaction` in `packages/persistence/src/db.ts` for multi-entity writes
- [ ] T010 [P] Write failing-then-passing Vitest migrate+seed (exactly four applications) in `packages/persistence/tests/migrations.test.ts`
- [ ] T011 [P] Write failing-then-passing Vitest corrupt open (checksum/size unchanged) in `packages/persistence/tests/corrupt_open.test.ts`
- [ ] T012 Implement SQLite-backed repositories in `packages/persistence/src/sqlite_repos.ts` matching `@los/domain` ports (replace MemoryStore as durable path)
- [ ] T013 [P] Implement legacy auto-import when DB absent + valid snapshot (`version` + exactly 4 applications) in `packages/persistence/src/legacy_import.ts` with Vitest in `packages/persistence/tests/legacy_import.test.ts` (never import over existing DB; leave sources intact on failure)
- [ ] T014 Export Node SQLite API from `packages/persistence/src/node.ts` / `index.ts` without breaking browser-safe barrel for preview

**Checkpoint**: Persistence Vitest covers migrate, corrupt-open, legacy import; repos CRUD on SQLite file

---

## Phase 3: User Story 1 - Durable local database on desktop (Priority: P1) 🎯 MVP

**Goal**: Tauri app-data SQLite across relaunch; recoverable corrupt open; legacy import notice  
**Independent Test**: SC-H01 (3× offline quit/relaunch) + SC-H04 corrupt file preserved

### Tests for User Story 1

- [ ] T015 [P] [US1] Add Vitest asserting bootstrap creates DB only when absent in `packages/persistence/tests/bootstrap_absent.test.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Wire Tauri app-data path `los/los.sqlite`, `db.bootstrap` (migrate + optional legacy import) in `apps/desktop/src-tauri/src/` per `contracts/desktop-bridge.md`
- [ ] T017 [US1] Expose Tauri invoke handlers for 001 workspace commands/queries over SQLite in `apps/desktop/src-tauri/` and clients in `apps/desktop/src/lib/api.ts`
- [ ] T018 [US1] Split runtimes in `apps/desktop/src/lib/runtime.ts`: Tauri → invoke/SQLite; Vite-only → labeled non-durable preview (not valid for SC-H01)
- [ ] T019 [US1] Show legacy import success/failure notice in `apps/desktop/src/App.tsx` or status banner from `db.bootstrap` result
- [ ] T020 [US1] Blocking recoverable UI for `DB_OPEN_FAILED` preserving path instructions in `apps/desktop/src/features/status/` (or dedicated error view)
- [ ] T021 [US1] Document real SQLite path + no-silent-reseed behavior in `apps/desktop/README.md`
- [ ] T022 [US1] Record SC-H01 relaunch trials (3×) and SC-H04 corrupt-open result in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Tauri-dev persists inbox across relaunch; corrupt DB does not reseed

---

## Phase 4: User Story 2 - Consistent multi-entity saves (Priority: P1)

**Goal**: `daily.upsert` atomic with next-action materialization  
**Independent Test**: SC-H03 injected mid-save failure → rollback

### Tests for User Story 2

- [ ] T023 [P] [US2] Write failing-then-passing transaction test (fail after action insert, before review commit → no orphans) in `packages/persistence/tests/daily_transaction.test.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Wrap `dailyUpsert` action + review/line writes in `withTransaction` in `packages/app-services/src/workspace.ts` (or `daily.ts`)
- [ ] T025 [US2] Confirm Tauri daily invoke path uses transactional service in `apps/desktop/src-tauri/` / `apps/desktop/src/lib/api.ts`

**Checkpoint**: SC-H03 automated test green

---

## Phase 5: User Story 3 - Backup and restore of the real database (Priority: P1)

**Goal**: Dual restore (quit-and-replace + in-app) against live SQLite  
**Independent Test**: SC-H02 automated restore smoke

### Tests for User Story 3

- [ ] T026 [P] [US3] Rewrite `packages/persistence/tests/backup_restore.test.ts` for SQLite: seed inbox → copy → mutate → restore → assert item returns

### Implementation for User Story 3

- [ ] T027 [US3] Implement backup helpers in `packages/persistence/src/backup.ts` (copy live `los.sqlite`)
- [ ] T028 [US3] Implement `db.exportBackup` and `db.restoreBackup` (close → replace → reopen/migrate) in `apps/desktop/src-tauri/` per `contracts/desktop-bridge.md`
- [ ] T029 [US3] Settings export + in-app restore UI reloading workspace in `apps/desktop/src/features/settings/SettingsPage.tsx`
- [ ] T030 [US3] Document quit-and-replace and in-app restore paths in `apps/desktop/README.md` and Settings copy (**FR-H06**)

**Checkpoint**: SC-H02 green; Settings restore works without manual quit

---

## Phase 6: User Story 4 - Fortnight history keeps completed selections (Priority: P2)

**Goal**: Selected actions remain visible when `status=done`  
**Independent Test**: SC-H06 select → complete → still listed

### Tests for User Story 4

- [ ] T031 [P] [US4] Add test that fortnight `selectedActionIds` resolve including `done` actions in `packages/app-services/tests/fortnight_selections.test.ts` (or persistence test)

### Implementation for User Story 4

- [ ] T032 [US4] Load selection list by ID including completed (show status) in `apps/desktop/src/features/reviews/FortnightPlanPage.tsx` (do not filter open-only for selections)
- [ ] T033 [US4] Record SC-H06 result in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Completed selected work remains on fortnight plan UI

---

## Phase 7: User Story 5 - Settings-driven global shortcut (Priority: P2)

**Goal**: OS registration uses settings; immediate re-register on save; failures surfaced  
**Independent Test**: SC-H07 denied shortcut → in-app capture + status error

### Implementation for User Story 5

- [ ] T034 [US5] Register shortcut from WorkspaceSettings (not hard-coded-only) in `apps/desktop/src-tauri/src/shortcuts.rs`
- [ ] T035 [US5] Implement `shortcuts.reregister` invoke; call immediately after explicit Settings save of accelerator/enabled in `apps/desktop/src/features/settings/SettingsPage.tsx` + `apps/desktop/src-tauri/`
- [ ] T036 [US5] Extend `workspace.status` with `globalShortcutRegistered` / `globalShortcutError` and show in `apps/desktop/src/features/status/LocalStatus.tsx`
- [ ] T037 [US5] Record SC-H07 shortcut smoke (success or denial) in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Settings save re-registers; capture works when registration fails

---

## Phase 8: User Story 6 - Verification honesty and quality gates (Priority: P2)

**Goal**: Lint green; evidence honest; offline/tray/keyboard recorded  
**Independent Test**: SC-H05, SC-H08, SC-H09

- [ ] T038 [US6] Execute offline core smoke (capture/triage/actions/reviews) and record in `specs/002-harden-foundation/checklists/verification-evidence.md`
- [ ] T039 [US6] Execute tray open + quick capture smoke (or skip with OS reason) in verification-evidence.md
- [ ] T040 [US6] Execute keyboard path smoke (capture → triage → actions) in verification-evidence.md (**FR-022**)
- [ ] T041 [P] [US6] Confirm no Jira/Confluence/LLM deps in workspace `package.json` files; record SC-H09
- [ ] T042 [US6] Final honesty pass: only `[X]` verified 002 tasks; confirm 001 reconcile from T002–T003 still accurate (**FR-H12**)

**Checkpoint**: verification-evidence.md has pass/fail/skip rows for required paths; `pnpm lint` recorded

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Align `specs/002-harden-foundation/quickstart.md` commands with actual package scripts
- [ ] T044 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` and `cargo check` in `apps/desktop/src-tauri`; paste summaries into `specs/002-harden-foundation/checklists/verification-evidence.md`
- [ ] T045 [P] Update root `README.md` persistence section to SQLite app-data (not localStorage as durable desktop store)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** → blocks all stories
- **US1 (Phase 3)** after Phase 2 — MVP
- **US2–US3 (Phases 4–5)** after Phase 2; preferably after US1 bridge (T016–T017) for Tauri paths
- **US4–US5** after US1 Tauri bridge
- **US6** after behaviors exist (evidence template can start at T022)
- **Polish** after desired stories

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 | Phase 2 |
| US2 | Phase 2 (`withTransaction` + repos); Tauri daily path after T017 |
| US3 | Phase 2 + US1 bootstrap path |
| US4 | US1 data + fortnight UI |
| US5 | US1 settings/status bridge |
| US6 | Prior story behaviors for smokes |

### Parallel Opportunities

- T002/T003/T004 after T001
- T010/T011/T013 after T006–T008
- T023 parallel with US1 UI once T009/T012 done
- T031 parallel with US5
- T041/T043/T045 in polish window

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "T015 bootstrap_absent.test.ts"
Task: "T016 db.bootstrap in src-tauri"
# Then sequential bridge:
Task: "T017 invoke handlers + api.ts"
Task: "T018 runtime split"
```

---

## Parallel Example: Foundational tests

```bash
Task: "T010 migrations.test.ts"
Task: "T011 corrupt_open.test.ts"
Task: "T013 legacy_import.ts + tests"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1–2  
2. Phase 3 US1 (Tauri SQLite + corrupt-safe + legacy notice)  
3. **STOP** — validate SC-H01 / SC-H04  

### Incremental Delivery

1. US2 transactional daily  
2. US3 backup/restore  
3. US4 fortnight completed selections  
4. US5 shortcuts  
5. US6 + polish evidence  

### Finding cross-index

| Finding / criterion | Tasks |
|---------------------|-------|
| Audit P0 SQLite/migrations | T005–T012, T016 |
| Audit P0 silent wipe | T006, T011, T020 |
| Audit P0 app-data | T016–T018, T021 |
| Audit P1 T013–T016/T020 | T003, T016–T017 |
| Audit P1 daily atomicity | T009, T023–T025 |
| Audit P1 fortnight | T031–T033 |
| Audit P1 shortcut | T034–T037 |
| Audit P1 lint | T004, T044 |
| Audit P1 evidence/tasks | T001–T003, T022, T038–T042 |
| FR-H05 dual restore | T026–T030 |
| FR-H14 auto-import notice | T013, T019 |
| Const. VII–IX | T007–T011, T042 |

---

## Notes

- [P] = different files, no incomplete dependency
- [USn] required on story-phase tasks only
- Spec tests (SC-H02–H04) → Vitest tasks included above
- Vite preview must not be used to claim SC-H01
