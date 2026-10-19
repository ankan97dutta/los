# Implementation Plan: Fortnightly Capacity and Commitment Planning

**Branch**: `feature/003-fortnight-capacity` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-fortnight-capacity/spec.md` (clarify session 2026-10-19 applied)  
**Baselines**: Constitution; 001 foundation; 002 SQLite hardening (do not weaken)

## Summary

Add period-scoped **team capacity**, **candidate work demand**, **allocations/commitments/stretch**, soft-gate conflict warnings (plan stays conflicted), **close-out history** with frozen plan structure, and **optional carry-forward copies** into the next fortnight (auto-created if needed). Reuse Applications and fortnight period identity; keep Personal Actions / Inbox / Daily Review intact. Domain owns deterministic capacity/load math; persistence uses versioned migrations; UI is keyboard-friendly and offline.

## Technical Context

**Language/Version**: TypeScript 5.x (domain, app-services, UI); Rust stable (Tauri 2 shell — thin OS only)

**Primary Dependencies**: Existing monorepo (Tauri 2, React 19, Vitest, pnpm, SQLite via `DbSession` dual adapters from 002)

**Storage**: Same `$APP_DATA/los/los.sqlite`; new tables via `migrations/002_capacity_planning.sql` after `001_init`

**Testing**: Vitest for capacity/load math, unknown≠zero, soft-gate overload, assignee-required commitment, period close snapshot, carry-forward + next-period create; persistence migrate/round-trip; recorded offline relaunch smoke

**Target Platform**: macOS-first desktop (same as foundation)

**Project Type**: Desktop feature on existing monorepo

**Performance Goals**: Interactive planning edits feel immediate; full first-pass plan &lt; 15 minutes (SC-C05)

**Constraints**: Offline; no Jira/LLM/cloud required; explainable deterministic calculations; soft-gate conflicts (no silent resolve); freeze on close; no silent data loss; single-writer

**Scale/Scope**: One lead modeling a small team roster; one fortnight at a time; not enterprise RM

## Constitution Check

*GATE: before Phase 0 — pass. Post-design re-check below.*

| Gate | Plan disposition |
|------|------------------|
| Offline core | Pass — local SQLite only |
| No LLM required | Pass — deterministic math in domain |
| Privacy default | Pass — no new outbound paths |
| Adapter isolation | Pass — Jira optional/out of scope |
| Ownership clarity | Pass — planning entities LOS-owned; Applications reused |
| Modular boundaries | Pass — domain pure; SQL in persistence; UI thin |
| Migration safety | Pass — versioned SQL + transactional close (snapshot + carry-forward) |
| Test evidence | Pass — calculation + persistence + verification checklist |
| Spec completeness | Pass — clarify session locked soft gate, freeze, carry-forward, assignee |
| Desktop UX | Pass — keyboard FR-C18; conflicted plan honesty |

**Post-design re-check**: Design adds tables/ports without coupling domain to Tauri/SQL. Complexity justified: period-scoped demand separate from PersonalAction; snapshot + optional carry-forward copies preserve honest history (FR-C12/C19).

## Project Structure

### Documentation (this feature)

```text
specs/003-fortnight-capacity/
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
packages/domain/src/
  capacity.ts                 # net capacity + load totals (pure)
  planning.ts                 # work item / allocation validation helpers
  ports.ts                    # new repository ports
packages/persistence/
  migrations/002_capacity_planning.sql
  src/sqlite_repos.ts         # extend repos
  tests/capacity_*.test.ts
packages/app-services/src/
  capacity_planning.ts        # orchestration commands
apps/desktop/src/features/planning/
  CapacityPlanPage.tsx        # primary UI (or fortnight capacity tab)
```

**Structure Decision**: Extend existing packages; new UI feature folder under desktop; no new package. App-services expose planning commands; desktop uses in-process services on live `DbSession` (002 composition).

## Complexity Tracking

| Violation / debt | Why needed | Simpler alternative rejected |
|------------------|------------|------------------------------|
| Period-scoped CandidateWork ≠ PersonalAction | Team demand semantics differ (estimate/unknown/blocked/external); PersonalAction is lead personal work | Stuffing capacity fields onto PersonalAction → conflates inbox/daily with team plan |
| Historical commitment snapshot on close | SC-C04 / FR-C12 require history after live status changes | Live-only join → history mutates silently |
| Optional carry-forward copies + auto next period | FR-C19 / SC-C08; clarify chose optional copy | Notes-only → loses operational continuity; auto-copy-all → silent duplication |

## Clarification → design mapping

| Spec decision | Design impact |
|---------------|---------------|
| Hours | Store effort/capacity as numeric hours (0.5 steps); gross = free-entry availableHours |
| Local roster | `team_members` + period capacity rows; no auth |
| Soft overload gate | `acceptWarnings` on allocate/close; `planConflicted` stays true until conflicts cleared |
| Freeze on close | Structural commands return `PERIOD_CLOSED`; notes via `periodSaveMeta` allowed |
| Optional carry-forward | `carryForwardWorkItemIds` on close; new rows + `carriedFromWorkItemId` |
| Auto-create next period | Close resolves next fortnight; inserts open `PlanningPeriodMeta` if missing |
| Commitment requires assignee | Domain/API reject `commitment` with null `teamMemberId` |
| Stretch vs commit | `commitment_kind` enum; stretch excluded from committed load |
| Unknown ≠ zero | `estimate_hours` null + `estimate_unknown` |

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/planning-api.md](./contracts/planning-api.md) |
| Quickstart | [quickstart.md](./quickstart.md) |
