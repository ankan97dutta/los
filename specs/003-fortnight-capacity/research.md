# Research: Fortnightly Capacity and Commitment Planning

**Feature**: `003-fortnight-capacity`  
**Date**: 2026-10-19  
**Status**: Phase 0 complete (no NEEDS CLARIFICATION remain)

## R1. Demand entity vs PersonalAction

**Decision**: Introduce period-scoped **Candidate Work Item** entities. Do not replace or overload `PersonalAction`. Optional future link field may reference a PersonalAction id; not required for MVP.

**Rationale**: Personal Actions are lead-owned open/done items from inbox/daily. Team capacity demand needs estimate/unknown, blocked/waiting-external, stretch vs commit—different lifecycle. Constitution V/VI favor clear ownership and simple boundaries.

**Alternatives considered**:
- **Extend PersonalAction**: Contaminates personal workflow; rejected.
- **Only free-text commitments** (001 style): Insufficient for capacity math; rejected for this feature.

## R2. Capacity unit

**Decision**: Hours (non-negative; domain allows multiples of 0.5).

**Rationale**: Spec assumption; deterministic and explainable. Story points deferred.

## R3. Net capacity formula

**Decision**:

```
gross = available_hours
deductions = leave_hours + reserved_commitment_hours + unplanned_buffer_hours
net = max(0, gross - deductions)   # display also shows raw gross - deductions if negative for overload clarity
```

UI shows each term. If `gross - deductions < 0`, show negative remaining / overload on the member (do not invent capacity).

**Rationale**: FR-C03/C04; SC-C01.

## R4. Load totals

**Decision**:
- Committed load = sum of `estimate_hours` for items with `commitment_kind = commitment` and non-null estimate, allocated to the member (or period total).
- Unestimated committed items counted separately; excluded from numeric load.
- Stretch items excluded from committed load; may show informational stretch hours separately.

**Rationale**: FR-C06, FR-C09; stretch assumption in spec.

## R5. Period identity

**Decision**: Key planning rows by `period_start` (and `period_end`) using existing `fortnightContaining` / settings weekday. Capacity planning coexists with existing `FortnightPlan` personal selections; shared period dates, separate tables.

**Rationale**: FR-C01, FR-C15/C16.

## R6. History on close

**Decision**: On explicit close, write a **commitment snapshot** (JSON or normalized snapshot tables) of committed/stretch items (ids, titles, estimates, assignees, kinds, statuses at close) plus outcome/carryover/reason fields. Live work updates do not mutate snapshot.

**Rationale**: FR-C12, SC-C04. Prefer snapshot table/rows for queryability; JSON blob acceptable if versioned and tested.

## R7. Persistence

**Decision**: New migration `002_capacity_planning.sql` (or next free number) on existing SQLite; repositories via `DbSession`; transactional saves for allocate+commit batch where multi-row.

**Rationale**: Constitution VII; 002 Runtime Composition.

## R8. Conflicts

**Decision**: Warnings are first-class in app-services results (`CAPACITY_OVERLOAD`, `COMMIT_BLOCKED_ITEM`, `COMMIT_UNKNOWN_ESTIMATE`). UI requires explicit confirm to proceed when warnings present; never auto-rebalance.

**Rationale**: FR-C10.

## Out of scope (confirmed)

- Jira import, auto-scheduling, multi-user sync, story points, CSP changes unrelated to feature
