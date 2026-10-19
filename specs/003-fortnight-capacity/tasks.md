# Tasks: Fortnightly Capacity and Commitment Planning

**Input**: Design documents from `/specs/003-fortnight-capacity/`  
**Prerequisites**: plan.md, spec.md (clarify 2026-10-19; analyze remediations I1/U1/U2/C1), research.md, data-model.md, contracts/  
**Tests**: Included for SC-C01, SC-C03, SC-C04, SC-C08 (domain/app-services/persistence)  
**Rule**: Never mark `[X]` without verification evidence  
**Baseline**: Do not break 001/002 Personal Actions, Inbox, Fortnight selections, or SQLite durability  
**Remediations**: I1 soft-gate API; U1 incomplete = commitment ∧ status ∉ {done,dropped}; U2 title-only description; C1 backup/restore evidence

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no incomplete deps)
- **[USn]**: User-story phase only
- Include exact file paths

---

## Phase 1: Setup

**Purpose**: Feature docs inventory and migration slot

- [x] T001 Create `specs/003-fortnight-capacity/checklists/verification-evidence.md` stub (commands + smoke table empty)
- [x] T002 [P] Confirm next migration number unused under `packages/persistence/migrations/` and reserve `002_capacity_planning.sql` in plan note if still free

---

## Phase 2: Foundational (Blocking)

**Purpose**: Domain math, ports, migration, repos — required before UI stories

**⚠️ CRITICAL**: Complete before user-story UI phases

- [x] T003 Define pure capacity/load helpers in `packages/domain/src/capacity.ts` (`grossHours`/`deductionHours`/`netHours` may be negative; committed load excludes unknown and stretch; unallocated never in committed load) per `data-model.md` / research R3–R4
- [x] T004 [P] Add failing-then-passing Vitest for SC-C01 cases in `packages/domain/tests/capacity.test.ts` (unknown ≠ zero; negative net display; stretch excluded)
- [x] T005 Add allocation validation helpers in `packages/domain/src/planning.ts` (`commitmentKind=commitment` requires non-null `teamMemberId`; `estimateUnknown=true` ⇒ `estimateHours` MUST be null)
- [x] T006 [P] Vitest for assignee/estimate invariants in `packages/domain/tests/planning_work.test.ts`
- [x] T007 Extend repository ports in `packages/domain/src/ports.ts` for TeamMember, PeriodMemberCapacity, CandidateWorkItem (`carriedFromWorkItemId` optional), WorkAllocation, PlanningPeriodMeta (`warningsAcknowledgedAt`), CommitmentSnapshot
- [x] T008 Add SQL migration `packages/persistence/migrations/002_capacity_planning.sql` creating tables per `data-model.md` (unique `(period_start, team_member_id)`; `estimate_unknown` vs `estimate_hours`; `commitment_kind` check; `carried_from_work_item_id` nullable)
- [x] T009 Implement sqlite repos for planning entities in `packages/persistence/src/planning_repos.ts` (exported via persistence barrel / `createSqliteRepos` or parallel factory)
- [x] T010 [P] Vitest migrate applies `002` and round-trips capacity + work row in `packages/persistence/tests/capacity_migrate.test.ts`
- [x] T011 Bump `APP_MAX_SCHEMA_VERSION` and embed `002` in `packages/persistence/src/ports.ts` + `packages/persistence/src/migrations_embedded.ts` so Tauri/Node migrate includes capacity tables
- [x] T012 Export new ports/helpers from `packages/domain/src/index.ts` and persistence barrels without breaking browser-safe index

**Checkpoint**: Domain tests green; migration applies on Node bootstrap

---

## Phase 3: User Story 1 - Team capacity (P1) 🎯 MVP slice A

**Goal**: Roster + capacity inputs + explainable net hours persisted  
**Independent Test**: Save capacity, quit/relaunch, same gross/deductions/net (SC-C02 subset)

### Tests

- [x] T013 [P] [US1] App-services test capacity upsert + summary net hours in `packages/app-services/tests/capacity_planning.test.ts`

### Implementation

- [x] T014 [US1] Implement `planning.membersList` / `memberUpsert` / `capacityUpsert` / period ensure in `packages/app-services/src/capacity_planning.ts` (hours ≥ 0 step 0.5; reject empty `displayName` max 200)
- [x] T015 [US1] Wire planning API clients in `apps/desktop/src/lib/api.ts`
- [x] T016 [US1] Capacity UI: roster + per-member inputs + explainable breakdown in `apps/desktop/src/features/planning/CapacityPlanPage.tsx` (keyboard-focusable fields; FR-C18)
- [x] T017 [US1] Nav entry to planning page in `apps/desktop/src/App.tsx` without removing Inbox/Daily/Fortnight personal flows
- [ ] T018 [US1] Record capacity save + relaunch note in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

**Checkpoint**: Capacity editable and durable on Tauri path

---

## Phase 4: User Story 2 - Work demand (P1)

**Goal**: Candidate work with unknown/blocked/estimate vs actual  
**Independent Test**: Mixed items persist; unknown not treated as zero

### Tests

- [x] T019 [P] [US2] App-services Vitest work upsert validation (`estimateUnknown` vs hours; status enum) in `packages/app-services/tests/planning_work.test.ts`

### Implementation

- [x] T020 [US2] Implement `planning.workUpsert` / `workList` in `packages/app-services/src/capacity_planning.ts` (statuses `ready|blocked|waiting_external|done|dropped`; required `title` max 4000 as the description—no separate description field; `applicationId` optional FK to existing Applications)
- [x] T021 [US2] Demand list UI in `apps/desktop/src/features/planning/DemandPanel.tsx` (or section on CapacityPlanPage) with unknown/blocked affordances
- [ ] T022 [US2] Record demand persistence smoke row in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

**Checkpoint**: Demand list round-trips; unknown distinct from zero

---

## Phase 5: User Story 3 - Commitments & load (P1)

**Goal**: Allocate, commit vs stretch, soft-gate warnings, trade-offs; commitment requires assignee  
**Independent Test**: SC-C03 — overload warning + ack keeps `planConflicted`; unallocated commitment rejected

### Tests

- [x] T023 [P] [US3] App-services test: `allocate` persists conflicted commitment without `acceptWarnings`, returns `warnings` + `planConflicted=true` in `packages/app-services/tests/capacity_warnings.test.ts`
- [x] T024 [P] [US3] App-services test `COMMIT_REQUIRES_ASSIGNEE` when `commitmentKind=commitment` and `teamMemberId=null` in `packages/app-services/tests/allocate_assignee.test.ts`

### Implementation

- [x] T025 [US3] Implement `planning.allocate` + `planning.periodGet` summary/warnings/`planConflicted` in `packages/app-services/src/capacity_planning.ts` per `contracts/planning-api.md` (no `acceptWarnings` on allocate)
- [x] T026 [US3] Implement `planning.periodSaveMeta` for tradeoff notes (also allowed when closed — notes only)
- [x] T027 [US3] UI: allocation controls, load vs capacity, warning banners; confirm **before** calling allocate when result would be conflicted; conflicted badge remains after confirm in `apps/desktop/src/features/planning/CapacityPlanPage.tsx`
- [x] T028 [US3] Stretch vs commitment visual distinction; block commitment UI path when unallocated
- [ ] T029 [US3] Record overload soft-gate + assignee-reject smokes in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

**Checkpoint**: Cannot treat overload as clean; unallocated cannot be commitment

---

## Phase 6: User Story 4 - Close & history (P2)

**Goal**: Snapshot on close; freeze plan structure; optional carry-forward + auto next period  
**Independent Test**: SC-C04 + SC-C08

### Tests

- [x] T030 [P] [US4] Vitest close writes snapshot; live status change does not alter snapshot; structural edit → `PERIOD_CLOSED`; close with warnings requires `acceptWarnings=true` in `packages/app-services/tests/planning_close.test.ts`
- [x] T031 [P] [US4] Vitest carry-forward: eligible = `commitment` ∧ `status ∉ {done,dropped}`; auto-creates next period; `done`/`dropped` → `CARRY_FORWARD_INVALID`; snapshot unchanged in `packages/app-services/tests/planning_carry_forward.test.ts`

### Implementation

- [x] T032 [US4] Implement transactional `planning.periodClose` (snapshot + status=`closed` + `acceptWarnings` soft gate + optional `carryForwardWorkItemIds` with U1 eligibility + next-period create) and `planning.historyGet` in `packages/app-services/src/capacity_planning.ts`
- [x] T033 [US4] Enforce `PERIOD_CLOSED` on capacity/work/allocate mutations; allow notes via `periodSaveMeta` in same service module
- [x] T034 [US4] History / read-only closed period UI + carry-forward multi-select (only eligible incomplete commitments) on close in `apps/desktop/src/features/planning/PlanningHistory.tsx` (or close dialog on CapacityPlanPage)
- [ ] T035 [US4] Record close/history + carry-forward (+ missing next period) smokes in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

**Checkpoint**: Closed period frozen; carry-forward creates next-period copies without rewriting history

---

## Phase 7: User Story 5 - Offline / scope (P2)

**Goal**: Offline durability; no Jira/LLM; keyboard path  
**Independent Test**: SC-C02, SC-C06, SC-C07

- [ ] T036 [US5] Execute offline edit + relaunch ×3; record SC-C02 in `specs/003-fortnight-capacity/checklists/verification-evidence.md`
- [ ] T037 [P] [US5] Confirm no Jira/Confluence/LLM deps in capacity flow; record SC-C07 in verification-evidence.md
- [ ] T038 [US5] Keyboard path smoke SC-C06 (member + work + allocate + save) recorded in verification-evidence.md
- [ ] T039 [US5] Timed dry-run SC-C05 (roster + ≥3 items + allocations + commit) recorded in verification-evidence.md
- [x] T040 [US5] Backup then restore smoke with capacity/planning rows present (reuse 002 backup path); record constitution Migration-safety evidence in `specs/003-fortnight-capacity/checklists/verification-evidence.md`

---

## Phase 8: Polish

- [x] T041 [P] Align `specs/003-fortnight-capacity/quickstart.md` with real scripts/nav labels
- [x] T042 Update `apps/desktop/README.md` (or root README) with Capacity planning entry + freeze/carry-forward notes
- [x] T043 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` + `cargo check`; paste into verification-evidence.md
- [x] T044 Final honesty pass: only `[X]` with evidence; 001/002 flows still smoke-ok (inbox capture still works)

---

## Dependencies & Execution Order

```text
Phase 1 → Phase 2 (domain + migration + repos)
→ US1 capacity → US2 demand → US3 allocate/soft-gate/assignee
→ US4 close/freeze/carry-forward → US5 offline/evidence → Polish
```

### User Story Dependencies

| Story | Depends on | Independently testable after |
|-------|------------|------------------------------|
| US1 | Phase 2 | Capacity save/relaunch |
| US2 | Phase 2 (+ US1 period shell helpful) | Demand CRUD without allocations |
| US3 | US1 + US2 data | Soft-gate + assignee rules |
| US4 | US3 commitments | Close/snapshot/carry-forward |
| US5 | US1–US4 flows present | Offline + keyboard evidence |

### Parallel Opportunities

- T004 with T005–T006; T010 after T008–T009
- T013 / T019 / T023–T024 / T030–T031 after their service surfaces exist
- T037 with T036

---

## Implementation Strategy

### MVP

Phases 1–5 through T029 (capacity + demand + commitments/soft-gate/assignee on durable SQLite).

### Incremental

US4 freeze/history/carry-forward → US5 evidence (incl. backup/restore) → polish.

### Requirement traceability

| Requirement / SC | Tasks |
|------------------|-------|
| FR-C01–C04 capacity | T003–T004, T014–T018 |
| FR-C05–C07 demand (title-only desc) | T005–T006, T019–T022 |
| FR-C08 assignee + allocate | T005–T006, T024–T028 |
| FR-C09–C11 load/warnings/tradeoffs | T023, T025–T029 |
| FR-C10 soft gate (I1) | T023, T027, T029–T030, T032 |
| FR-C12 freeze + history | T030, T032–T035 |
| FR-C19 carry-forward (U1) | T031–T035 |
| FR-C13–C14, C17–C18 offline/a11y | T016, T036–T038 |
| FR-C15–C16 reuse/baseline | T017, T020, T044 |
| Migration safety backup (C1) | T040 |
| SC-C01 | T004 |
| SC-C02 | T018, T036 |
| SC-C03 | T023, T029 |
| SC-C04 | T030, T035 |
| SC-C08 | T031, T035 |
| SC-C05–C06 | T038–T039 |
| SC-C07 | T037 |

---

## Notes

- [P] = parallelizable; [USn] on story phases only
- Soft gate: allocate has no `acceptWarnings` (UI confirms); close requires `acceptWarnings` when warnings remain
- Incomplete for carry-forward: `commitment` ∧ status not `done`/`dropped`
- Do not mark acceptance complete without command/smoke evidence
- Vite preview may use MemoryStore only if planning repos also supported there; acceptance remains Tauri SQLite
