# Data Model: Fortnightly Capacity and Commitment Planning

**Feature**: `003-fortnight-capacity`  
**Date**: 2026-10-19  
**Updated**: Clarify session 2026-10-19  
**Baseline**: [001 data-model](../001-foundation-workspace/data-model.md) + [002 persistence delta](../002-harden-foundation/data-model.md)

## Period key

All period-scoped entities use:

| Field | Rules |
|-------|--------|
| `periodStart` | Local date; fortnight start (existing calendar rules) |
| `periodEnd` | Local date; `periodStart + 13 days` |

**Next period** (carry-forward): `fortnightContaining(addDays(periodEnd, 1), fortnightStartWeekday)`.

## Entities

### TeamMember

Global (workspace) roster entry reused across periods.

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `displayName` | Required non-empty; max 200 |
| `active` | bool; inactive members cannot be newly allocated |
| `createdAt` / `updatedAt` | datetime |

### PeriodMemberCapacity

Per member per period capacity inputs.

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `periodStart` | fortnight key |
| `teamMemberId` | FK TeamMember |
| `availableHours` | number ≥ 0; step 0.5 |
| `leaveHours` | number ≥ 0; step 0.5 |
| `reservedCommitmentHours` | number ≥ 0; step 0.5 |
| `unplannedBufferHours` | number ≥ 0; step 0.5 |
| `updatedAt` | datetime |

**Uniqueness**: `(periodStart, teamMemberId)`

**Derived** (compute on read; do not treat cache as source of truth):
- `grossHours` = `availableHours`
- `deductionHours` = leave + reserved + buffer
- `netHours` = `availableHours - deductionHours` (may be negative for display)

### CandidateWorkItem

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `periodStart` | fortnight key |
| `title` | Required non-empty; max 4000 (this is the work description; no separate description field) |
| `priority` | enum: `p0` \| `p1` \| `p2` \| `p3`; default `p2` |
| `estimateHours` | number ≥ 0 step 0.5, **or null** if unknown |
| `estimateUnknown` | bool; if true, `estimateHours` MUST be null |
| `actualHours` | number ≥ 0 step 0.5, optional null |
| `applicationId` | FK Application or null |
| `status` | `ready` \| `blocked` \| `waiting_external` \| `done` \| `dropped` |
| `dependencyNotes` | text; max 4000; optional |
| `carriedFromWorkItemId` | optional UUID of source item in a prior period (null if not a carry-forward copy) |
| `personalActionId` | optional FK PersonalAction (nullable; unused in MVP flows OK) |
| `createdAt` / `updatedAt` | datetime |

### WorkAllocation

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `workItemId` | FK CandidateWorkItem |
| `teamMemberId` | FK TeamMember or **null** (unallocated) |
| `commitmentKind` | `none` \| `commitment` \| `stretch` |
| `updatedAt` | datetime |

**Uniqueness**: one allocation row per `workItemId` (single assignee model for MVP).

**Invariant**: If `commitmentKind = commitment`, then `teamMemberId` MUST be non-null.

### PlanningPeriodMeta

| Field | Rules |
|-------|--------|
| `periodStart` | PK |
| `periodEnd` | required |
| `status` | `open` \| `closed` |
| `tradeoffNotes` | text |
| `outcomeSummary` | text |
| `carryoverNotes` | text |
| `warningsAcknowledgedAt` | datetime? — set when lead last confirmed soft-gate warnings while conflicts remain |
| `closedAt` | datetime? |
| `updatedAt` | datetime |

**Derived**: `planConflicted` = true when any CAPACITY_OVERLOAD / COMMIT_BLOCKED_ITEM / COMMIT_UNKNOWN_ESTIMATE warning applies to current commitments (independent of acknowledgment). Acknowledgment allows keeping selections; it does not clear `planConflicted`.

### CommitmentSnapshot (on close)

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `periodStart` | FK period (unique: one snapshot per closed period) |
| `payload` | structured snapshot of commitments/stretch at close (items + assignee names/ids + estimates + statuses + kinds) |
| `createdAt` | datetime |

Payload MUST be sufficient to render history without joining mutable live status.

## State transitions

```text
PlanningPeriodMeta.status: open → closed  (explicit periodClose; idempotent if already closed)
Closed → open: NOT supported in MVP

CandidateWorkItem.status: ready | blocked | waiting_external | done | dropped
  (free transitions while period open; frozen when period closed)
```

## Close transaction (atomic)

1. Validate period open (or idempotent closed).
2. If commitment warnings present and `acceptWarnings` false → return warning errors (close only; allocate has no `acceptWarnings`).
3. Write/replace CommitmentSnapshot from current commitments/stretch.
4. Set status=`closed`, review fields, `closedAt`.
5. If `carryForwardWorkItemIds` non-empty:
   - Resolve next period; create `PlanningPeriodMeta` open row if missing.
   - For each eligible id: `commitmentKind=commitment` AND `status ∉ {done, dropped}` AND belongs to this period → insert new CandidateWorkItem (+ default allocation `none`/unallocated) with `carriedFromWorkItemId`. Others → `CARRY_FORWARD_INVALID`.
6. Commit.

## Validation summary

- Reject empty names/titles; reject negative hours; reject `estimateUnknown=true` with non-null estimate.
- Reject `commitment` without assignee (`COMMIT_REQUIRES_ASSIGNEE`).
- While `status=closed`: reject mutations to roster capacity rows for that period, work upserts, allocate; allow `periodSaveMeta` for notes fields only.
- Overload/blocked/unknown warnings are service-layer results, not DB constraints.

## Relationship to 001 entities

| Existing | Role in 003 |
|----------|-------------|
| Application | Target for CandidateWorkItem |
| FortnightPlan / selections | Unchanged personal focus; same period dates |
| PersonalAction | Optional link only; not capacity demand unit |
| WorkspaceSettings.fortnightStartWeekday | Period boundary + next-period create |
