# Data Model: Fortnightly Capacity and Commitment Planning

**Feature**: `003-fortnight-capacity`  
**Date**: 2026-10-19  
**Baseline**: [001 data-model](../001-foundation-workspace/data-model.md) + [002 persistence delta](../002-harden-foundation/data-model.md)

## Period key

All period-scoped entities use:

| Field | Rules |
|-------|--------|
| `periodStart` | Local date; fortnight start (existing calendar rules) |
| `periodEnd` | Local date; `periodStart + 13 days` |

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

**Derived** (not stored, or stored as cache with recompute on write):
- `grossHours` = `availableHours`
- `deductionHours` = leave + reserved + buffer
- `netHours` = `availableHours - deductionHours` (may be negative for display)

### CandidateWorkItem

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `periodStart` | fortnight key |
| `title` | Required non-empty; max 4000 |
| `priority` | enum: `p0` \| `p1` \| `p2` \| `p3` (or 1–4); default `p2` |
| `estimateHours` | number ≥ 0 step 0.5, **or null** if unknown |
| `estimateUnknown` | bool; if true, `estimateHours` MUST be null |
| `actualHours` | number ≥ 0 step 0.5, optional null |
| `applicationId` | FK Application or null |
| `status` | `ready` \| `blocked` \| `waiting_external` \| `done` \| `dropped` |
| `dependencyNotes` | text; max 4000; optional |
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

### PlanningPeriodMeta

| Field | Rules |
|-------|--------|
| `periodStart` | PK |
| `periodEnd` | required |
| `status` | `open` \| `closed` |
| `tradeoffNotes` | text |
| `outcomeSummary` | text |
| `carryoverNotes` | text |
| `closedAt` | datetime? |
| `updatedAt` | datetime |

### CommitmentSnapshot (on close)

| Field | Rules |
|-------|--------|
| `id` | UUID PK |
| `periodStart` | FK period |
| `payload` | structured snapshot of commitments/stretch at close (items + assignee names/ids + estimates + statuses + kinds) |
| `createdAt` | datetime |

Payload MUST be sufficient to render history without joining mutable live status.

## Validation summary

- Reject empty names/titles; reject negative hours; reject `estimateUnknown=true` with non-null estimate.
- Closing requires period exists; snapshot write + status=`closed` in one transaction.
- Overload/blocked/unknown warnings are service-layer results, not DB constraints.

## Relationship to 001 entities

| Existing | Role in 003 |
|----------|-------------|
| Application | Target for CandidateWorkItem |
| FortnightPlan / selections | Unchanged personal focus; same period dates |
| PersonalAction | Optional link only; not capacity demand unit |
| WorkspaceSettings.fortnightStartWeekday | Period boundary input |
