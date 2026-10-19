# Tasks: Fortnightly Capacity and Commitment Planning

**Input**: Design documents from `/specs/003-fortnight-capacity/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Tests**: Included for SC-C01, SC-C03, SC-C04 (domain/app-services/persistence)  
**Rule**: Never mark `[X]` without verification evidence  
**Baseline**: Do not break 001/002 Personal Actions, Inbox, Fortnight selections, or SQLite durability

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup

**Purpose**: Feature docs inventory and migration slot

- [ ] T001 Create `specs/003-fortnight-capacity/checklists/verification-evidence.md` stub (commands + smoke table empty)
- [ ] T002 [P] Confirm next migration number unused under `packages/persistence/migrations/` and reserve `002_capacity_planning.sql` (or next free) in plan note

---

## Phase 2: Foundational (Blocking)

**Purpose**: Domain math, ports, migration, repos — required before UI stories

**⚠️ CRITICAL**: Complete before user-story UI phases

- [ ] T003 Define pure capacity/load helpers in `packages/domain/src/capacity.ts` (net hours; committed load; unknown excluded; stretch excluded from committed load) per `data-model.md` / research R3–R4
- [ ] T004 [P] Add failing-then-passing Vitest for SC-C01 cases in `packages/domain/tests/capacity.test.ts` (unknown ≠ zero; overload remaining)
- [ ] T005 Extend repository ports in `packages/domain/src/ports.ts` for TeamMember, PeriodMemberCapacity, CandidateWorkItem, WorkAllocation, PlanningPeriodMeta, CommitmentSnapshot
- [ ] T006 Add SQL migration `packages/persistence/migrations/002_capacity_planning.sql` creating tables per `data-model.md` (constraints: unique period+member; estimate_unknown vs estimate_hours)
- [ ] T007 Implement sqlite repos for planning entities in `packages/persistence/src/sqlite_repos.ts` (or `planning_repos.ts` exported from persistence)
- [ ] T008 [P] Vitest migrate applies `002` and round-trips capacity row in `packages/persistence/tests/capacity_migrate.test.ts`
- [ ] T009 Bump `APP_MAX_SCHEMA_VERSION` / embedded migrations in `packages/persistence/src/ports.ts` + `migrations_embedded.ts` so Tauri migrate includes `002`
- [ ] T010 Export new ports/helpers from `packages/domain/src/index.ts` and persistence barrels without breaking browser-safe index

**Checkpoint**: Domain tests green; migration applies on Node bootstrap

---

## Phase 3: User Story 1 - Team capacity (P1) 🎯 MVP slice A

**Goal**: Roster + capacity inputs + explainable net hours persisted  
**Independent Test**: SC-C02 subset — save capacity, relaunch, same numbers

### Tests

- [ ] T011 [P] [US1] App-services test capacity upsert + summary net hours in `packages/app-services/tests/capacity_planning.test.ts`

### Implementation

- [ ] T012 [US1] Implement `planning.membersList` / `memberUpsert` / `capacityUpsert` / period ensure in `packages/app-services/src/capacity_planning.ts`
- [ ] T013 [US1] Wire API clients in `apps/desktop/src/lib/api.ts`
- [ ] T014 [US1] Capacity UI: roster + per-member inputs + breakdown in `apps/desktop/src/features/planning/CapacityPlanPage.tsx` (keyboard-focusable fields)
- [ ] T015 [US1] Nav entry to planning page in `apps/desktop/src/App.tsx`
- [ ] T016 [US1] Record capacity save + relaunch note in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

**Checkpoint**: Capacity editable and durable on Tauri path

---

## Phase 4: User Story 2 - Work demand (P1)

**Goal**: Candidate work with unknown/blocked/estimate vs actual  
**Independent Test**: Mixed items persist; unknown not zero

### Tests

- [ ] T017 [P] [US2] Vitest work upsert validation (`estimateUnknown` vs hours) in `packages/domain/tests/planning_work.test.ts` or app-services tests

### Implementation

- [ ] T018 [US2] Implement `planning.workUpsert` / `workList` in `packages/app-services/src/capacity_planning.ts` (statuses per data-model; `applicationId` optional FK)
- [ ] T019 [US2] Demand list UI on CapacityPlanPage (or `DemandPanel.tsx`) with unknown/blocked affordances
- [ ] T020 [US2] Record demand persistence smoke row in verification-evidence.md

**Checkpoint**: Demand list round-trips; unknown distinct

---

## Phase 5: User Story 3 - Commitments & load (P1)

**Goal**: Allocate, commit vs stretch, warnings, trade-offs  
**Independent Test**: SC-C03 overload warning

### Tests

- [ ] T021 [P] [US3] App-services test overload + blocked/unknown commitment warnings in `packages/app-services/tests/capacity_warnings.test.ts`

### Implementation

- [ ] T022 [US3] Implement `planning.allocate` + `planning.periodGet` summary/warnings in `packages/app-services/src/capacity_planning.ts` per `contracts/planning-api.md`
- [ ] T023 [US3] Implement `planning.periodSaveMeta` for tradeoff notes
- [ ] T024 [US3] UI: allocation controls, load vs capacity, warning banners, explicit confirm when warnings present
- [ ] T025 [US3] Stretch vs commitment visual distinction in planning UI
- [ ] T026 [US3] Record overload-warning smoke in verification-evidence.md

**Checkpoint**: Cannot silently treat overload as clean commit

---

## Phase 6: User Story 4 - Close & history (P2)

**Goal**: Snapshot on close; history stable  
**Independent Test**: SC-C04

### Tests

- [ ] T027 [P] [US4] Vitest close writes snapshot; live status change does not alter snapshot in `packages/app-services/tests/planning_close.test.ts`

### Implementation

- [ ] T028 [US4] Implement `planning.periodClose` + `planning.historyGet` with transactional snapshot in `packages/app-services/src/capacity_planning.ts`
- [ ] T029 [US4] History/read-only closed period UI in `apps/desktop/src/features/planning/PlanningHistory.tsx` (or section)
- [ ] T030 [US4] Record close/history smoke in verification-evidence.md

**Checkpoint**: Closed period readable after live edits

---

## Phase 7: User Story 5 - Offline / scope (P2)

**Goal**: Offline durability; no Jira/LLM  
**Independent Test**: SC-C02, SC-C07

- [ ] T031 [US5] Execute offline edit + relaunch ×3; record SC-C02 in verification-evidence.md
- [ ] T032 [P] [US5] Confirm no Jira/Confluence/LLM deps; record SC-C07 in verification-evidence.md
- [ ] T033 [US5] Keyboard path smoke SC-C06 recorded in verification-evidence.md

---

## Phase 8: Polish

- [ ] T034 [P] Align `quickstart.md` with real scripts/nav labels
- [ ] T035 Update root or `apps/desktop/README.md` with Capacity planning entry + period notes
- [ ] T036 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` + `cargo check`; paste into verification-evidence.md
- [ ] T037 Final honesty pass: only `[X]` with evidence; 001/002 flows still smoke-ok (inbox capture still works)

---

## Dependencies & Execution Order

```text
Phase 1 → Phase 2 (domain + migration + repos)
→ US1 capacity → US2 demand → US3 allocate/warnings
→ US4 close/history → US5 offline/evidence → Polish
```

### Parallel Opportunities

- T004 with T005; T008 after T006–T007; T011/T017/T021/T027 after foundational services exist
- T032 with T031

---

## Implementation Strategy

### MVP

Phases 1–5 through T026 (capacity + demand + commitments/warnings on durable SQLite).

### Incremental

US4 history → US5 evidence → polish.

### Requirement traceability

| Requirement / SC | Tasks |
|------------------|-------|
| FR-C01–C04 capacity | T003–T004, T012–T016 |
| FR-C05–C07 demand | T017–T020 |
| FR-C08–C11 plan/warnings | T021–T026 |
| FR-C12 history | T027–T030 |
| FR-C13–C14, C17–C18 offline/a11y | T031–T033, T014 |
| FR-C15–C16 reuse/baseline | T015, T037 |
| SC-C01 | T004 |
| SC-C02 | T016, T031 |
| SC-C03 | T021, T026 |
| SC-C04 | T027, T030 |
| SC-C05–C06 | T033, timed dry-run in evidence |
| SC-C07 | T032 |

---

## Notes

- [P] = parallelizable; [USn] on story phases only
- Do not implement until spec/plan/tasks reviewed
- Vite preview may use MemoryStore only if planning repos also supported there; acceptance remains Tauri SQLite
