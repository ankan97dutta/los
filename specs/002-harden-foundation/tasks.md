# Tasks: Harden Foundation Persistence & Acceptance

**Input**: Design documents from `/specs/002-harden-foundation/`  
**Prerequisites**: plan.md (Runtime Composition), spec.md (clarified), research.md, data-model.md, contracts/  
**Tests**: Included per SC-H02–H04, C1 (`DB_SCHEMA_TOO_NEW`), FR-H11/H12  
**Analyze remediation**: I1 composition, C1 schema-too-new, U1 transactional wiring, L1 Tauri `withTransaction`, A1 single-writer docs/fail-safe  
**Rule**: Never mark `[X]` without verification

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Honesty baseline and dependencies

- [X] T001 Create `specs/002-harden-foundation/checklists/pre-remediation-inventory.md` documenting current persistence paths (`apps/desktop/src/lib/runtime.ts`, `packages/persistence/src/file_store.ts`, Tauri app-data gap)
- [X] T002 [P] Correct overclaimed rows in `specs/001-foundation-workspace/checklists/implementation-evidence.md` and link to 002 verification evidence
- [X] T003 [P] Reconcile `specs/001-foundation-workspace/tasks.md`: uncheck or annotate unfinished SQLite/Tauri items (e.g. T013–T016, T020)
- [X] T004 Fix domain/persistence TypeScript lint (`rootDir` vs tests) in `packages/domain/tsconfig.json` and `packages/persistence/tsconfig.json` so `pnpm lint` succeeds
- [X] T005 Add `better-sqlite3` (+ types) to `packages/persistence/package.json` and `@tauri-apps/plugin-sql` / `tauri-plugin-sql` to `apps/desktop/package.json` + `apps/desktop/src-tauri/Cargo.toml` per plan Runtime Composition

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `DbSession` port, dual adapters, migrations, repos (I1)

**⚠️ CRITICAL**: No user story phase until this checkpoint passes

- [X] T006 Define `DbSession` / migrate / `withTransaction` ports in `packages/persistence/src/ports.ts` (driver-agnostic)
- [X] T007 Implement corrupt-safe / fail-safe open + path helper using Node driver in `packages/persistence/src/node_sqlite.ts` (create DB only if file absent; locked/busy/invalid → `DB_OPEN_FAILED` preserves bytes per `data-model.md` and plan A1; no delete/reseed)
- [X] T008 Implement versioned migration runner over `DbSession` in `packages/persistence/src/migrate.ts` applying `packages/persistence/migrations/*.sql` with `schema_migrations` (`version`, `applied_at`) in a transaction per migration
- [X] T009 Align `packages/persistence/migrations/001_init.sql` with 001 entities + seed exactly four Applications (`Application 1`–`Application 4`, slotIndex 1..4) and default WorkspaceSettings (`fortnightStartWeekday=mon`)
- [X] T010 Implement `withTransaction` on Node `DbSession` in `packages/persistence/src/node_sqlite.ts`
- [X] T011 [P] Write failing-then-passing Vitest migrate+seed (exactly four applications) in `packages/persistence/tests/migrations.test.ts`
- [X] T012 [P] Write failing-then-passing Vitest corrupt open (checksum/size unchanged) in `packages/persistence/tests/corrupt_open.test.ts`
- [X] T013 Implement driver-agnostic repos in `packages/persistence/src/sqlite_repos.ts` over `DbSession` (durable path); keep `MemoryStore` only for Vite preview (T020)
- [X] T014 [P] Implement legacy auto-import when DB absent + valid snapshot (`version` + exactly 4 applications) in `packages/persistence/src/legacy_import.ts` + Vitest in `packages/persistence/tests/legacy_import.test.ts`
- [X] T015 [P] Write Vitest for `DB_SCHEMA_TOO_NEW`: refuse restore/open when backup schema version exceeds app max **before** replacing live file in `packages/persistence/tests/schema_too_new.test.ts` (analyze C1)
- [X] T016 Export Node SQLite + ports from `packages/persistence/src/node.ts` / `index.ts` without breaking browser-safe barrel for preview

**Checkpoint**: Node Vitest covers migrate, corrupt-open, legacy import, schema-too-new; repos use `DbSession`

---

## Phase 3: User Story 1 - Durable local database on desktop (Priority: P1) 🎯 MVP

**Goal**: Tauri app-data SQLite via plugin-sql adapter + shared repos; corrupt-safe; legacy notice  
**Independent Test**: SC-H01 (3×) + SC-H04

### Tests for User Story 1

- [X] T017 [P] [US1] Add Vitest asserting bootstrap creates DB only when absent in `packages/persistence/tests/bootstrap_absent.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Implement full `DbSession` via `@tauri-apps/plugin-sql` in `apps/desktop/src/lib/tauriSqlAdapter.ts` including **`withTransaction`** (BEGIN/COMMIT/ROLLBACK parity with Node T010; analyze L1) plus exec/query used by shared migrate/repos
- [X] T019 [US1] Wire Tauri app-data path `los/los.sqlite` + `db.bootstrap` (migrate + legacy import) in `apps/desktop/src-tauri/src/` per `contracts/desktop-bridge.md`; fail-safe open on lock/corrupt → `DB_OPEN_FAILED`, preserve file (analyze A1)
- [X] T020 [US1] Split runtimes in `apps/desktop/src/lib/runtime.ts`: Tauri → `tauriSqlAdapter` + app-services; Vite-only → labeled non-durable `MemoryStore` (not SC-H01)
- [X] T021 [US1] Thin invoke clients for bootstrap/status/OS helpers in `apps/desktop/src/lib/api.ts`; workspace CRUD via in-process app-services on live `DbSession` per plan composition
- [X] T022 [US1] Show legacy import success/failure notice from `db.bootstrap` in `apps/desktop/src/App.tsx` or status banner
- [X] T023 [US1] Blocking recoverable UI for `DB_OPEN_FAILED` with path instructions in `apps/desktop/src/features/status/` (or dedicated error view)
- [X] T024 [US1] Document real SQLite path + Runtime Composition + no-silent-reseed + single-writer assumption in `apps/desktop/README.md`
- [ ] T025 [US1] Record SC-H01 relaunch trials (3×) and SC-H04 corrupt-open in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Tauri-dev persists across relaunch; preview clearly non-durable

---

## Phase 4: User Story 2 - Consistent multi-entity saves (Priority: P1)

**Goal**: `daily.upsert` atomic on `DbSession.withTransaction`  
**Independent Test**: SC-H03

### Tests for User Story 2

- [X] T026 [P] [US2] Write failing-then-passing transaction test (fail after action insert, before review commit → rollback) in `packages/persistence/tests/daily_transaction.test.ts`

### Implementation for User Story 2

- [X] T027 [US2] Wrap `dailyUpsert` action + review/line writes in `withTransaction` in `packages/app-services/src/workspace.ts` (or `daily.ts`) using injected `DbSession`
- [X] T028 [US2] Wire Tauri runtime so daily autosave uses the same transactional `dailyUpsert` on `tauriSqlAdapter` `DbSession` (requires T018 `withTransaction`) in `apps/desktop/src/lib/runtime.ts` / `apps/desktop/src/features/reviews/DailyReviewPage.tsx` (replaces prior “confirm-only” task; analyze L1)

**Checkpoint**: SC-H03 green on Node; Tauri path uses same service

---

## Phase 5: User Story 3 - Backup and restore of the real database (Priority: P1)

**Goal**: Dual restore; schema-too-new safe  
**Independent Test**: SC-H02 + C1

### Tests for User Story 3

- [X] T029 [P] [US3] Rewrite `packages/persistence/tests/backup_restore.test.ts` for SQLite: seed inbox → copy → mutate → restore → assert item returns

### Implementation for User Story 3

- [X] T030 [US3] Implement backup helpers in `packages/persistence/src/backup.ts` (copy live `los.sqlite`)
- [X] T031 [US3] Implement `db.exportBackup` / `db.restoreBackup` with pre-replace `DB_SCHEMA_TOO_NEW` check in `apps/desktop/src-tauri/` per `contracts/desktop-bridge.md`
- [X] T032 [US3] Settings export + in-app restore UI reloading workspace in `apps/desktop/src/features/settings/SettingsPage.tsx`
- [X] T033 [US3] Document quit-and-replace and in-app restore in `apps/desktop/README.md` and Settings copy (**FR-H06**)
- [X] T034 [US3] Record SC-H02 and schema-too-new restore refusal in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Restore smoke green; newer-schema backup does not clobber live DB

---

## Phase 6: User Story 4 - Fortnight history keeps completed selections (Priority: P2)

**Goal**: Selected actions visible when `status=done`  
**Independent Test**: SC-H06

### Tests for User Story 4

- [X] T035 [P] [US4] Add test that fortnight `selectedActionIds` resolve including `done` in `packages/app-services/tests/fortnight_selections.test.ts`

### Implementation for User Story 4

- [X] T036 [US4] Load selection list by ID including completed (show status) in `apps/desktop/src/features/reviews/FortnightPlanPage.tsx`
- [X] T037 [US4] Record SC-H06 in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Completed selected work remains on plan UI

---

## Phase 7: User Story 5 - Settings-driven global shortcut (Priority: P2)

**Goal**: Settings-driven register; immediate re-register on save  
**Independent Test**: SC-H07

- [X] T038 [US5] Register shortcut from WorkspaceSettings in `apps/desktop/src-tauri/src/shortcuts.rs`
- [X] T039 [US5] Implement `shortcuts.reregister`; call immediately after explicit Settings save in `apps/desktop/src/features/settings/SettingsPage.tsx` + `apps/desktop/src-tauri/`
- [X] T040 [US5] Extend `workspace.status` with `globalShortcutRegistered` / `globalShortcutError` in `apps/desktop/src/features/status/LocalStatus.tsx`
- [ ] T041 [US5] Record SC-H07 in `specs/002-harden-foundation/checklists/verification-evidence.md`

**Checkpoint**: Save re-registers; capture works when registration fails

---

## Phase 8: User Story 6 - Verification honesty and quality gates (Priority: P2)

**Goal**: Lint + honest evidence  
**Independent Test**: SC-H05, SC-H08, SC-H09

- [ ] T042 [US6] Execute offline core smoke and record in `specs/002-harden-foundation/checklists/verification-evidence.md`
- [X] T043 [US6] Execute tray open + quick capture smoke (or skip with OS reason) in verification-evidence.md — **skipped**: no interactive tray/display in agent session
- [ ] T044 [US6] Execute keyboard path smoke in verification-evidence.md (**FR-022**)
- [X] T045 [P] [US6] Confirm no Jira/Confluence/LLM deps in `package.json` / `packages/*/package.json` / `apps/desktop/package.json`; record SC-H09 in verification-evidence.md
- [X] T046 [US6] Final honesty pass: only `[X]` verified 002 tasks; confirm 001 reconcile (**FR-H12**) — pending remain T025/T041/T042/T044 (interactive Tauri)

**Checkpoint**: Evidence rows complete; lint recorded

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T047 [P] Align `specs/002-harden-foundation/quickstart.md` with actual scripts + Runtime Composition note
- [X] T048 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` and `cargo check`; paste into verification-evidence.md
- [X] T049 [P] Update root `README.md` persistence to SQLite app-data + preview vs Tauri distinction + **single-writer** assumption and fail-safe open (do not run two writers; lock/corrupt → file unchanged) per plan A1 / research R12

---

## Dependencies & Execution Order

```text
Phase 1 → Phase 2 (DbSession + Node adapter + repos) → US1 (Tauri adapter + bootstrap)
US2 after T010/T013 + T027; T028 after US1 adapter (T018–T020)
US3 after US1 bootstrap; T015/T031 for schema-too-new
US4–US5 after US1 data bridge
US6 after smokes possible
Polish last
```

### Parallel Opportunities

- T002–T004; T011/T012/T014/T015 after T008–T009
- T017 with US1 impl start; T026 with US1 UI; T035 with US5

---

## Implementation Strategy

### MVP

Phases 1–3 through T025 (durable Tauri SQLite + composition + corrupt-safe + legacy notice).

### Incremental

US2 → US3 (incl. schema-too-new) → US4 → US5 → US6 → polish.

### Finding cross-index

| Finding / criterion | Tasks |
|---------------------|-------|
| Analyze I1 composition | T006–T007, T013, T018–T021 |
| Analyze C1 schema-too-new | T015, T031, T034 |
| Analyze U1 daily wiring | T027–T028 |
| Analyze L1 Tauri `withTransaction` | T010, T018, T027–T028 |
| Analyze A1 single-writer / fail-safe | T007, T019, T024, T049 |
| Audit P0 SQLite/migrations | T005, T008–T011, T019 |
| Audit P0 silent wipe | T007, T012, T023 |
| FR-H05 dual restore | T029–T033 |
| FR-H14 import notice | T014, T022 |
| FR-H09 shortcut | T038–T041 |

---

## Notes

- [P] = parallelizable; [USn] on story phases only
- Vite preview must not claim SC-H01
- Shared app-services + dual `DbSession` adapters — no domain SQL, no Rust domain rewrite
- Both adapters MUST implement `withTransaction` (L1); README documents single-writer (A1)
