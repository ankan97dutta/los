# Tasks: Foundational LOS Desktop Workspace

**Input**: Design documents from `/specs/001-foundation-workspace/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Domain/persistence Vitest tasks are included because plan.md and constitution require automated test evidence for domain rules, period math, and persistence (not optional for this feature).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Monorepo per plan.md: `apps/desktop/`, `packages/domain/`, `packages/persistence/`, `packages/app-services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo, tooling, and package skeletons

- [X] T001 Create monorepo root workspace files `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json` at repository root (pnpm only per plan.md)
- [X] T002 [P] Scaffold `packages/domain/package.json`, `packages/domain/tsconfig.json`, and `packages/domain/src/index.ts` as a pure TypeScript library with Vitest
- [X] T003 [P] Scaffold `packages/persistence/package.json`, `packages/persistence/tsconfig.json`, and `packages/persistence/src/index.ts` with Vitest
- [X] T004 [P] Scaffold `packages/app-services/package.json`, `packages/app-services/tsconfig.json`, and `packages/app-services/src/index.ts` with Vitest
- [X] T005 Scaffold Tauri 2 + React + Vite app under `apps/desktop/` (`apps/desktop/package.json`, `apps/desktop/src/`, `apps/desktop/src-tauri/`) targeting macOS
- [X] T006 [P] Add root README section documenting local-only / offline-first intent and package layout in `README.md`
- [X] T007 [P] Configure ESLint/Prettier (or Biome) at repo root so domain/persistence/app-services/desktop share formatting rules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain ports, SQLite migrations, settings, period math, and desktop shell wiring required by all stories

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [X] T008 Define shared domain error codes and Result types in `packages/domain/src/result.ts`
- [X] T009 [P] Implement fortnight helpers `fortnightContaining`, navigation ±14 days, default start weekday `mon` in `packages/domain/src/periods/fortnight.ts` per data-model.md
- [X] T010 [P] Implement `localToday` / month helpers in `packages/domain/src/periods/calendar.ts` (local timezone; `YYYY-MM-DD` / `YYYY-MM`)
- [X] T011 [P] Add Vitest coverage for fortnight/month math with fixed clocks in `packages/domain/tests/periods.test.ts`
- [X] T012 Define persistence port interfaces (repositories) in `packages/domain/src/ports/` matching entities in data-model.md
- [ ] T013 Implement SQLite migration runner + `packages/persistence/migrations/001_init.sql` creating tables for Application, InboxItem, PersonalAction, DailyReview, DailyNextActionLine, FortnightPlan, FortnightSelection, MonthlyReview, WorkspaceSettings — **incomplete at 001; tracked in 002**
- [ ] T014 Seed exactly four Application rows (`slotIndex` 1..4, names `Application 1`..`Application 4`) in `packages/persistence/migrations/001_init.sql` (or `002_seed_applications.sql`) — **SQL drafted; runner not applied at 001; tracked in 002**
- [ ] T015 Seed singleton WorkspaceSettings (`fortnightStartWeekday=mon`, shortcut defaults) in persistence migrations under `packages/persistence/migrations/` — **SQL drafted; tracked in 002**
- [ ] T016 Implement SQLite connection bootstrap (app data directory path) in `packages/persistence/src/db.ts` and wire from `apps/desktop/src-tauri/` — **001 used JSON/localStorage; SQLite bootstrap in 002**
- [X] T017 [P] Implement in-memory fake repositories for domain tests in `packages/persistence/src/fakes/` (or `packages/domain/tests/fakes/`)
- [X] T018 Implement `settings.get` / `settings.update` in `packages/app-services/src/settings.ts` per `specs/001-foundation-workspace/contracts/workspace-commands.md` and `workspace-queries.md` (explicit confirm path for weekday change left to UI later)
- [X] T019 Implement `workspace.status` query returning `mode: "local_only"` and tray/shortcut capability flags in `packages/app-services/src/workspace_status.ts`
- [ ] T020 Expose Tauri invoke handlers for settings + workspace.status in `apps/desktop/src-tauri/src/lib.rs` (or commands module) and thin TS clients in `apps/desktop/src/lib/api.ts` — **partial (`workspace_status` only); durable bridge in 002**
- [X] T021 Add shell layout with Local-only status indicator and navigation placeholders in `apps/desktop/src/App.tsx` (no Jira/Confluence/LLM entry points)
- [X] T022 [P] Document DB file location and migration-on-startup behavior in `apps/desktop/README.md`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Open LOS and capture to inbox (Priority: P1) 🎯 MVP

**Goal**: Launch offline desktop app, capture non-empty inbox items, persist across restart

**Independent Test**: Launch offline → capture → quit → relaunch offline → item present (spec US1)

### Tests for User Story 1

- [X] T023 [P] [US1] Add Vitest for inbox capture validation (reject empty; reject over **4000** chars with explicit error; accept valid ≤4000) in `packages/domain/tests/inbox.test.ts`
- [X] T024 [P] [US1] Add persistence test that capture survives reopen using SQLite temp DB in `packages/persistence/tests/inbox_repo.test.ts`

### Implementation for User Story 1

- [X] T025 [P] [US1] Implement InboxItem entity + validation (`description` required non-empty after trim; **max length 4000** with explicit error, no silent truncate) in `packages/domain/src/inbox.ts`
- [X] T026 [US1] Implement inbox repository (SQLite) in `packages/persistence/src/inbox_repo.ts` with status `open|converted|dismissed` and `capturedAt`
- [X] T027 [US1] Implement `inbox.capture` and `inbox.listOpen` (newest `capturedAt` DESC) in `packages/app-services/src/inbox.ts` per contracts
- [X] T028 [US1] Wire Tauri commands for inbox capture/list in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`
- [X] T029 [US1] Build Inbox capture UI (reject empty/too-long with message; newest-first list) in `apps/desktop/src/features/inbox/InboxPage.tsx`
- [X] T030 [US1] Ensure cold start opens main window without account/network in `apps/desktop/src-tauri/` window config
- [X] T072 [US1] Ensure inbox capture field and submit are keyboard-operable (Tab/Enter path without pointer) in `apps/desktop/src/features/inbox/InboxPage.tsx` (FR-022)

**Checkpoint**: US1 MVP — capture + persist offline works alone

---

## Phase 4: User Story 2 - Triage the inbox (Priority: P2)

**Goal**: Convert / dismiss / keep inbox items; convert creates PersonalAction

**Independent Test**: Seed inbox items; convert one, dismiss one, keep one; verify lists without horizons (spec US2)

### Tests for User Story 2

- [X] T031 [P] [US2] Add Vitest for triage transitions (`open→converted`, `open→dismissed`, keep stays open; invalid state errors) in `packages/domain/tests/inbox_triage.test.ts`

### Implementation for User Story 2

- [X] T032 [P] [US2] Implement PersonalAction entity (`status` open|done; `source` manual|inbox|daily_next_action; optional `applicationId`; description max **4000**) in `packages/domain/src/actions.ts`
- [X] T033 [US2] Implement actions repository in `packages/persistence/src/actions_repo.ts`
- [X] T034 [US2] Implement `inbox.triage` (`convert|dismiss|keep`) creating action on convert and setting `convertedActionId` in `packages/app-services/src/inbox.ts`
- [X] T035 [US2] Add triage controls on inbox list UI in `apps/desktop/src/features/inbox/InboxPage.tsx`
- [X] T036 [US2] Show open actions list read-only/minimal view after convert in `apps/desktop/src/features/actions/ActionsPage.tsx` (full edit in US3)

**Checkpoint**: US2 independently testable with capture+triage only

---

## Phase 5: User Story 3 - Personal actions linked to applications (Priority: P3)

**Goal**: CRUD-ish actions, complete/reopen, link to one of four renameable applications

**Independent Test**: Create/link/complete/reopen actions without inbox/reviews (spec US3)

### Tests for User Story 3

- [X] T037 [P] [US3] Add Vitest for action status transitions and application link rules (at most one application; clear link) in `packages/domain/tests/actions.test.ts`
- [X] T038 [P] [US3] Add persistence test that four seeded applications exist and rename persists in `packages/persistence/tests/applications_repo.test.ts`

### Implementation for User Story 3

- [X] T039 [P] [US3] Implement applications repository + `applications.list` / `applications.rename` (name non-empty after trim) in `packages/persistence/src/applications_repo.ts` and `packages/app-services/src/applications.ts`
- [X] T040 [US3] Implement `actions.create`, `actions.update`, `actions.setStatus`, `actions.list` in `packages/app-services/src/actions.ts` per contracts
- [X] T041 [US3] Wire Tauri commands for actions/applications in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`
- [X] T042 [US3] Build Applications UI showing Application 1–4 with rename in `apps/desktop/src/features/applications/ApplicationsPage.tsx`
- [X] T043 [US3] Build Actions UI: create/edit, link/unlink application, complete/reopen, filter by status/application in `apps/desktop/src/features/actions/ActionsPage.tsx`
- [X] T073 [US3] Ensure actions and applications primary controls are keyboard-operable (Tab/Enter/Space) in `apps/desktop/src/features/actions/ActionsPage.tsx` and `apps/desktop/src/features/applications/ApplicationsPage.tsx` (FR-022)

**Checkpoint**: US3 works with seeded apps + actions alone

---

## Phase 6: User Story 4 - Daily review (Priority: P4)

**Goal**: Daily review sections + autosave status; next-action lines materialize PersonalActions via stable `lineId`

**Independent Test**: Fill four sections, autosave, relaunch offline; next actions create actions once (spec US4 + clarifications)

### Tests for User Story 4

- [X] T044 [P] [US4] Add Vitest for next-action rules: stable `lineId`; empty creates nothing; no duplicate on re-upsert; text change updates open linked action; clearing/removing line does **not** delete action in `packages/domain/tests/daily_next_actions.test.ts`

### Implementation for User Story 4

- [X] T045 [P] [US4] Implement DailyReview + DailyNextActionLine domain rules in `packages/domain/src/daily.ts` (outcomes/blockers/followUps text-only; next-action `lineId` create/update-open/no-delete-on-clear per FR-019)
- [X] T046 [US4] Implement daily repositories in `packages/persistence/src/daily_repo.ts` (unique `date`)
- [X] T047 [US4] Implement `daily.get` / `daily.upsert` with `createdActionIds` and open-action description sync on line edit in `packages/app-services/src/daily.ts` per contracts + FR-019
- [X] T048 [US4] Add shared debounced autosave hook (`unsaved|saving|saved|error`, ~400–800ms) in `apps/desktop/src/lib/autosave.ts` for daily **and** fortnight/monthly editors (FR-020)
- [X] T049 [US4] Build Daily Review UI with four sections + next-action lines + autosave via `autosave.ts` + day navigation + keyboard-operable fields in `apps/desktop/src/features/reviews/DailyReviewPage.tsx`
- [X] T050 [US4] Wire Tauri daily commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US4 independently testable with actions list for materialized next actions

---

## Phase 7: User Story 5 - Fortnightly planning (Priority: P5)

**Goal**: Fixed calendar fortnight plan: select actions + commitments; history navigation

**Independent Test**: Save current fortnight selections/commitments; open prior period without mutating current (spec US5)

### Tests for User Story 5

- [X] T051 [P] [US5] Add Vitest asserting fortnight period identity uses settings weekday and does not slide daily within period in `packages/domain/tests/fortnight_plan.test.ts`

### Implementation for User Story 5

- [X] T052 [P] [US5] Implement FortnightPlan + FortnightSelection persistence (unique `periodStart`; selection retained after action completion) in `packages/persistence/src/fortnight_repo.ts`
- [X] T053 [US5] Implement `fortnight.currentPeriod`, `fortnight.get`, `fortnight.upsert` in `packages/app-services/src/fortnight.ts` per contracts
- [X] T054 [US5] Build Fortnight Planning UI (period label, select open actions, commitments editor, **autosave via `apps/desktop/src/lib/autosave.ts`**, prev/next, keyboard-operable) in `apps/desktop/src/features/reviews/FortnightPlanPage.tsx`
- [X] T055 [US5] Add settings UI control to change `fortnightStartWeekday` with explicit confirmation in `apps/desktop/src/features/settings/SettingsPage.tsx` (FR-018)
- [X] T056 [US5] Wire Tauri fortnight/settings commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US5 works with existing actions + settings

---

## Phase 8: User Story 6 - Monthly review (Priority: P6)

**Goal**: Monthly improvement priorities with autosave and history

**Independent Test**: Save current month priorities; reopen offline; navigate prior month (spec US6)

### Tests for User Story 6

- [X] T057 [P] [US6] Add Vitest/persistence test for unique `yearMonth` upsert in `packages/persistence/tests/monthly_repo.test.ts`

### Implementation for User Story 6

- [X] T058 [P] [US6] Implement MonthlyReview persistence + `monthly.get` / `monthly.upsert` in `packages/persistence/src/monthly_repo.ts` and `packages/app-services/src/monthly.ts`
- [X] T059 [US6] Build Monthly Review UI (priorities editor, **autosave via `apps/desktop/src/lib/autosave.ts`**, month navigation, keyboard-operable) in `apps/desktop/src/features/reviews/MonthlyReviewPage.tsx`
- [X] T060 [US6] Wire Tauri monthly commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US6 independently testable

---

## Phase 9: User Story 7 - System tray and quick capture (Priority: P7)

**Goal**: Tray open/focus + quick capture; global shortcut when OS permits; in-app always

**Independent Test**: Tray/shortcut capture lands in inbox; if shortcut unavailable, in-app still works (spec US7)

### Implementation for User Story 7

- [X] T061 [US7] Implement system tray menu (Open workspace, Quick capture) in `apps/desktop/src-tauri/src/tray.rs` (or equivalent module)
- [X] T062 [US7] Implement global shortcut registration from WorkspaceSettings with graceful failure in `apps/desktop/src-tauri/src/shortcuts.rs`
- [X] T063 [US7] Implement quick-capture window/flow calling `inbox.capture` in `apps/desktop/src/features/inbox/QuickCapture.tsx`
- [X] T064 [US7] Surface tray/shortcut availability via `workspace.status` in Local-only / capabilities UI in `apps/desktop/src/features/status/LocalStatus.tsx` (FR-015, FR-021)
- [X] T065 [US7] Ensure in-app capture remains available when tray/shortcut unavailable in `apps/desktop/src/features/inbox/InboxPage.tsx`

**Checkpoint**: US7 degraded paths documented and usable

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: Evidence, docs, and constitution gates

- [X] T066 [P] Align `specs/001-foundation-workspace/quickstart.md` commands with actual package scripts in root/`apps/desktop/package.json`
- [X] T067 [P] Add empty-state copy for inbox/actions/reviews in respective feature pages under `apps/desktop/src/features/`
- [X] T068 Run full Vitest suite for domain + persistence and capture output as verification evidence in `specs/001-foundation-workspace/checklists/` or PR notes
- [X] T069 Execute offline manual smoke steps 1–8 from `specs/001-foundation-workspace/quickstart.md` and record results
- [X] T070 [P] Confirm no Jira/Confluence/LLM dependencies in `apps/desktop/package.json` and `packages/*/package.json`
- [X] T071 Document SQLite DB path and copy-out backup steps in `apps/desktop/README.md` (FR-023)
- [X] T074 Add restore smoke script or documented procedure that: seed known inbox item → copy DB aside → mutate/delete item → restore DB file → assert item returns, under `packages/persistence/tests/backup_restore.test.ts` or `scripts/smoke-backup-restore.sh` (FR-023)
- [X] T075 [P] Add Vitest for PersonalAction description max length **4000** in `packages/domain/tests/actions.test.ts`

---

## Dependencies & Story Order

```text
Phase 1 Setup → Phase 2 Foundational
                 ↓
              US1 (P1) MVP
                 ↓
              US2 (P2)  ← needs PersonalAction from convert
                 ↓
              US3 (P3)  ← expands actions + applications
                 ↓
         ┌───────┼───────┐
         ↓       ↓       ↓
       US4     US5     US6   (US5 needs actions; US4 creates actions; US6 independent of US4/5 after foundation)
         └───────┼───────┘
                 ↓
              US7 (P7)  ← needs inbox.capture
                 ↓
              Polish
```

**Recommended sequence**: US1 → US2 → US3 → US4 → US5 → US6 → US7 → Polish  
**Parallel after US3**: US4 / US5 / US6 can proceed in parallel if staffed (separate files)

## Parallel Opportunities

- Phase 1: T002–T004, T006–T007 in parallel after T001
- Phase 2: T009–T011, T017, T022 in parallel where noted
- Per-story `[P]` tasks: entity/tests often parallel before service wiring
- After US3: US4, US5, US6 UI/services in parallel across different feature folders

## Implementation Strategy

### MVP (User Story 1 only)

Complete Phases 1–2 + US1 (T001–T030). Validates local-first launch, capture, persistence offline.

### Incremental delivery

1. US2 triage → usable inbox workflow  
2. US3 applications/actions → structured worklist  
3. US4 daily → shortest planning horizon  
4. US5/US6 → longer horizons  
5. US7 → tray/shortcut convenience  
6. Polish → evidence for constitution gates  

### Independent test criteria (summary)

| Story | Independent test |
|-------|------------------|
| US1 | Offline capture survives restart |
| US2 | Convert/dismiss/keep without horizons |
| US3 | Actions + four apps without inbox/reviews |
| US4 | Daily autosave + next-action materialization |
| US5 | Fortnight selections/commitments + history |
| US6 | Monthly priorities + history |
| US7 | Tray/shortcut/in-app capture; degrade gracefully |

## Format Validation

- All tasks use `- [ ]`, IDs T001–T075 (including remediation T072–T075), file paths, story labels on US phases only
- `[P]` only on parallelizable tasks
- Setup/Foundational/Polish have no `[USn]` labels
