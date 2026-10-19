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

- [ ] T001 Create monorepo root workspace files `package.json`, `pnpm-workspace.yaml` (or npm workspaces), and `tsconfig.base.json` at repository root
- [ ] T002 [P] Scaffold `packages/domain/package.json`, `packages/domain/tsconfig.json`, and `packages/domain/src/index.ts` as a pure TypeScript library with Vitest
- [ ] T003 [P] Scaffold `packages/persistence/package.json`, `packages/persistence/tsconfig.json`, and `packages/persistence/src/index.ts` with Vitest
- [ ] T004 [P] Scaffold `packages/app-services/package.json`, `packages/app-services/tsconfig.json`, and `packages/app-services/src/index.ts` with Vitest
- [ ] T005 Scaffold Tauri 2 + React + Vite app under `apps/desktop/` (`apps/desktop/package.json`, `apps/desktop/src/`, `apps/desktop/src-tauri/`) targeting macOS
- [ ] T006 [P] Add root README section documenting local-only / offline-first intent and package layout in `README.md`
- [ ] T007 [P] Configure ESLint/Prettier (or Biome) at repo root so domain/persistence/app-services/desktop share formatting rules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain ports, SQLite migrations, settings, period math, and desktop shell wiring required by all stories

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [ ] T008 Define shared domain error codes and Result types in `packages/domain/src/result.ts`
- [ ] T009 [P] Implement fortnight helpers `fortnightContaining`, navigation ±14 days, default start weekday `mon` in `packages/domain/src/periods/fortnight.ts` per data-model.md
- [ ] T010 [P] Implement `localToday` / month helpers in `packages/domain/src/periods/calendar.ts` (local timezone; `YYYY-MM-DD` / `YYYY-MM`)
- [ ] T011 [P] Add Vitest coverage for fortnight/month math with fixed clocks in `packages/domain/tests/periods.test.ts`
- [ ] T012 Define persistence port interfaces (repositories) in `packages/domain/src/ports/` matching entities in data-model.md
- [ ] T013 Implement SQLite migration runner + `packages/persistence/migrations/001_init.sql` creating tables for Application, InboxItem, PersonalAction, DailyReview, DailyNextActionLine, FortnightPlan, FortnightSelection, MonthlyReview, WorkspaceSettings
- [ ] T014 Seed exactly four Application rows (`slotIndex` 1..4, names `Application 1`..`Application 4`) in `packages/persistence/migrations/001_init.sql` (or `002_seed_applications.sql`)
- [ ] T015 Seed singleton WorkspaceSettings (`fortnightStartWeekday=mon`, shortcut defaults) in persistence migrations under `packages/persistence/migrations/`
- [ ] T016 Implement SQLite connection bootstrap (app data directory path) in `packages/persistence/src/db.ts` and wire from `apps/desktop/src-tauri/`
- [ ] T017 [P] Implement in-memory fake repositories for domain tests in `packages/persistence/src/fakes/` (or `packages/domain/tests/fakes/`)
- [ ] T018 Implement `settings.get` / `settings.update` in `packages/app-services/src/settings.ts` per `specs/001-foundation-workspace/contracts/workspace-commands.md` and `workspace-queries.md` (explicit confirm path for weekday change left to UI later)
- [ ] T019 Implement `workspace.status` query returning `mode: "local_only"` and tray/shortcut capability flags in `packages/app-services/src/workspace_status.ts`
- [ ] T020 Expose Tauri invoke handlers for settings + workspace.status in `apps/desktop/src-tauri/src/lib.rs` (or commands module) and thin TS clients in `apps/desktop/src/lib/api.ts`
- [ ] T021 Add shell layout with Local-only status indicator and navigation placeholders in `apps/desktop/src/App.tsx` (no Jira/Confluence/LLM entry points)
- [ ] T022 [P] Document DB file location and migration-on-startup behavior in `apps/desktop/README.md`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Open LOS and capture to inbox (Priority: P1) 🎯 MVP

**Goal**: Launch offline desktop app, capture non-empty inbox items, persist across restart

**Independent Test**: Launch offline → capture → quit → relaunch offline → item present (spec US1)

### Tests for User Story 1

- [ ] T023 [P] [US1] Add Vitest for inbox capture validation (reject empty; reject over max length with explicit error; accept valid) in `packages/domain/tests/inbox.test.ts`
- [ ] T024 [P] [US1] Add persistence test that capture survives reopen using SQLite temp DB in `packages/persistence/tests/inbox_repo.test.ts`

### Implementation for User Story 1

- [ ] T025 [P] [US1] Implement InboxItem entity + validation (`description` required non-empty after trim; max length e.g. 4000 with explicit error, no silent truncate) in `packages/domain/src/inbox.ts`
- [ ] T026 [US1] Implement inbox repository (SQLite) in `packages/persistence/src/inbox_repo.ts` with status `open|converted|dismissed` and `capturedAt`
- [ ] T027 [US1] Implement `inbox.capture` and `inbox.listOpen` (newest `capturedAt` DESC) in `packages/app-services/src/inbox.ts` per contracts
- [ ] T028 [US1] Wire Tauri commands for inbox capture/list in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`
- [ ] T029 [US1] Build Inbox capture UI (reject empty with message) in `apps/desktop/src/features/inbox/InboxPage.tsx`
- [ ] T030 [US1] Ensure cold start opens main window without account/network in `apps/desktop/src-tauri/` window config

**Checkpoint**: US1 MVP — capture + persist offline works alone

---

## Phase 4: User Story 2 - Triage the inbox (Priority: P2)

**Goal**: Convert / dismiss / keep inbox items; convert creates PersonalAction

**Independent Test**: Seed inbox items; convert one, dismiss one, keep one; verify lists without horizons (spec US2)

### Tests for User Story 2

- [ ] T031 [P] [US2] Add Vitest for triage transitions (`open→converted`, `open→dismissed`, keep stays open; invalid state errors) in `packages/domain/tests/inbox_triage.test.ts`

### Implementation for User Story 2

- [ ] T032 [P] [US2] Implement PersonalAction entity (`status` open|done; `source` manual|inbox|daily_next_action; optional `applicationId`) in `packages/domain/src/actions.ts`
- [ ] T033 [US2] Implement actions repository in `packages/persistence/src/actions_repo.ts`
- [ ] T034 [US2] Implement `inbox.triage` (`convert|dismiss|keep`) creating action on convert and setting `convertedActionId` in `packages/app-services/src/inbox.ts`
- [ ] T035 [US2] Add triage controls on inbox list UI in `apps/desktop/src/features/inbox/InboxPage.tsx`
- [ ] T036 [US2] Show open actions list read-only/minimal view after convert in `apps/desktop/src/features/actions/ActionsPage.tsx` (full edit in US3)

**Checkpoint**: US2 independently testable with capture+triage only

---

## Phase 5: User Story 3 - Personal actions linked to applications (Priority: P3)

**Goal**: CRUD-ish actions, complete/reopen, link to one of four renameable applications

**Independent Test**: Create/link/complete/reopen actions without inbox/reviews (spec US3)

### Tests for User Story 3

- [ ] T037 [P] [US3] Add Vitest for action status transitions and application link rules (at most one application; clear link) in `packages/domain/tests/actions.test.ts`
- [ ] T038 [P] [US3] Add persistence test that four seeded applications exist and rename persists in `packages/persistence/tests/applications_repo.test.ts`

### Implementation for User Story 3

- [ ] T039 [P] [US3] Implement applications repository + `applications.list` / `applications.rename` (name non-empty after trim) in `packages/persistence/src/applications_repo.ts` and `packages/app-services/src/applications.ts`
- [ ] T040 [US3] Implement `actions.create`, `actions.update`, `actions.setStatus`, `actions.list` in `packages/app-services/src/actions.ts` per contracts
- [ ] T041 [US3] Wire Tauri commands for actions/applications in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`
- [ ] T042 [US3] Build Applications UI showing Application 1–4 with rename in `apps/desktop/src/features/applications/ApplicationsPage.tsx`
- [ ] T043 [US3] Build Actions UI: create/edit, link/unlink application, complete/reopen, filter by status/application in `apps/desktop/src/features/actions/ActionsPage.tsx`

**Checkpoint**: US3 works with seeded apps + actions alone

---

## Phase 6: User Story 4 - Daily review (Priority: P4)

**Goal**: Daily review sections + autosave status; next-action lines materialize PersonalActions via stable `lineId`

**Independent Test**: Fill four sections, autosave, relaunch offline; next actions create actions once (spec US4 + clarifications)

### Tests for User Story 4

- [ ] T044 [P] [US4] Add Vitest for next-action materialization idempotence (stable `lineId`; empty lines create nothing; no duplicate on re-upsert) in `packages/domain/tests/daily_next_actions.test.ts`

### Implementation for User Story 4

- [ ] T045 [P] [US4] Implement DailyReview + DailyNextActionLine domain rules in `packages/domain/src/daily.ts` (outcomes/blockers/followUps text-only; next actions create actions with `source=daily_next_action`)
- [ ] T046 [US4] Implement daily repositories in `packages/persistence/src/daily_repo.ts` (unique `date`)
- [ ] T047 [US4] Implement `daily.get` / `daily.upsert` with `createdActionIds` in `packages/app-services/src/daily.ts` per contracts
- [ ] T048 [US4] Add debounced autosave hook (`unsaved|saving|saved|error`, ~400–800ms) in `apps/desktop/src/lib/autosave.ts`
- [ ] T049 [US4] Build Daily Review UI with four sections + next-action lines + autosave indicator + day navigation in `apps/desktop/src/features/reviews/DailyReviewPage.tsx`
- [ ] T050 [US4] Wire Tauri daily commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US4 independently testable with actions list for materialized next actions

---

## Phase 7: User Story 5 - Fortnightly planning (Priority: P5)

**Goal**: Fixed calendar fortnight plan: select actions + commitments; history navigation

**Independent Test**: Save current fortnight selections/commitments; open prior period without mutating current (spec US5)

### Tests for User Story 5

- [ ] T051 [P] [US5] Add Vitest asserting fortnight period identity uses settings weekday and does not slide daily within period in `packages/domain/tests/fortnight_plan.test.ts`

### Implementation for User Story 5

- [ ] T052 [P] [US5] Implement FortnightPlan + FortnightSelection persistence (unique `periodStart`; selection retained after action completion) in `packages/persistence/src/fortnight_repo.ts`
- [ ] T053 [US5] Implement `fortnight.currentPeriod`, `fortnight.get`, `fortnight.upsert` in `packages/app-services/src/fortnight.ts` per contracts
- [ ] T054 [US5] Build Fortnight Planning UI (period label, select open actions, commitments editor, autosave, prev/next) in `apps/desktop/src/features/reviews/FortnightPlanPage.tsx`
- [ ] T055 [US5] Add settings UI control to change `fortnightStartWeekday` with explicit confirmation in `apps/desktop/src/features/settings/SettingsPage.tsx` (FR-018)
- [ ] T056 [US5] Wire Tauri fortnight/settings commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US5 works with existing actions + settings

---

## Phase 8: User Story 6 - Monthly review (Priority: P6)

**Goal**: Monthly improvement priorities with autosave and history

**Independent Test**: Save current month priorities; reopen offline; navigate prior month (spec US6)

### Tests for User Story 6

- [ ] T057 [P] [US6] Add Vitest/persistence test for unique `yearMonth` upsert in `packages/persistence/tests/monthly_repo.test.ts`

### Implementation for User Story 6

- [ ] T058 [P] [US6] Implement MonthlyReview persistence + `monthly.get` / `monthly.upsert` in `packages/persistence/src/monthly_repo.ts` and `packages/app-services/src/monthly.ts`
- [ ] T059 [US6] Build Monthly Review UI (priorities editor, autosave status, month navigation) in `apps/desktop/src/features/reviews/MonthlyReviewPage.tsx`
- [ ] T060 [US6] Wire Tauri monthly commands in `apps/desktop/src-tauri/` and `apps/desktop/src/lib/api.ts`

**Checkpoint**: US6 independently testable

---

## Phase 9: User Story 7 - System tray and quick capture (Priority: P7)

**Goal**: Tray open/focus + quick capture; global shortcut when OS permits; in-app always

**Independent Test**: Tray/shortcut capture lands in inbox; if shortcut unavailable, in-app still works (spec US7)

### Implementation for User Story 7

- [ ] T061 [US7] Implement system tray menu (Open workspace, Quick capture) in `apps/desktop/src-tauri/src/tray.rs` (or equivalent module)
- [ ] T062 [US7] Implement global shortcut registration from WorkspaceSettings with graceful failure in `apps/desktop/src-tauri/src/shortcuts.rs`
- [ ] T063 [US7] Implement quick-capture window/flow calling `inbox.capture` in `apps/desktop/src/features/inbox/QuickCapture.tsx`
- [ ] T064 [US7] Surface tray/shortcut availability via `workspace.status` in Local-only / capabilities UI in `apps/desktop/src/features/status/LocalStatus.tsx` (FR-015, FR-021)
- [ ] T065 [US7] Ensure in-app capture remains available when tray/shortcut unavailable in `apps/desktop/src/features/inbox/InboxPage.tsx`

**Checkpoint**: US7 degraded paths documented and usable

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: Evidence, docs, and constitution gates

- [ ] T066 [P] Align `specs/001-foundation-workspace/quickstart.md` commands with actual package scripts in root/`apps/desktop/package.json`
- [ ] T067 [P] Add empty-state copy for inbox/actions/reviews in respective feature pages under `apps/desktop/src/features/`
- [ ] T068 Run full Vitest suite for domain + persistence and capture output as verification evidence in `specs/001-foundation-workspace/checklists/` or PR notes
- [ ] T069 Execute offline manual smoke steps 1–8 from `specs/001-foundation-workspace/quickstart.md` and record results
- [ ] T070 [P] Confirm no Jira/Confluence/LLM dependencies in `apps/desktop/package.json` and `packages/*/package.json`
- [ ] T071 Add brief backup note (copy SQLite file) to `apps/desktop/README.md` for migration-safety gate

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

- All tasks use `- [ ]`, sequential IDs T001–T071, file paths, story labels on US phases only
- `[P]` only on parallelizable tasks
- Setup/Foundational/Polish have no `[USn]` labels
