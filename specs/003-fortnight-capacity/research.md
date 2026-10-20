# Research: Fortnightly Capacity and Commitment Planning

**Feature**: `003-fortnight-capacity`  
**Date**: 2026-10-19  
**Status**: Phase 0 complete (no NEEDS CLARIFICATION remain)  
**Updated**: Clarify session 2026-10-19 (soft gate, freeze, carry-forward, assignee rule)

## R1. Demand entity vs PersonalAction

**Decision**: Introduce period-scoped **Candidate Work Item** entities. Do not replace or overload `PersonalAction`. Optional future link field may reference a PersonalAction id; not required for MVP.

**Rationale**: Personal Actions are lead-owned open/done items from inbox/daily. Team capacity demand needs estimate/unknown, blocked/waiting-external, stretch vs commit—different lifecycle. Constitution V/VI favor clear ownership and simple boundaries.

**Alternatives considered**:
- **Extend PersonalAction**: Contaminates personal workflow; rejected.
- **Only free-text commitments** (001 style): Insufficient for capacity math; rejected for this feature.

## R2. Capacity unit

**Decision**: Hours (non-negative; domain allows multiples of 0.5). Gross capacity is a free-entry `availableHours` total (not a working-day calendar product in MVP).

**Rationale**: Spec assumption; deterministic and explainable. Story points deferred. Working-day breakdown can be added later without changing the net formula.

## R3. Net capacity formula

**Decision**:

```
gross = available_hours
deductions = leave_hours + reserved_commitment_hours + unplanned_buffer_hours
raw_net = gross - deductions
display_net = raw_net          # may be negative (overload / over-deduction)
load_net = raw_net             # remaining = load_net - committed_load (may be negative)
```

UI shows each term. Do not invent capacity when deductions exceed gross.

**Rationale**: FR-C03/C04; SC-C01; clarify edge case for zero/negative capacity.

## R4. Load totals

**Decision**:
- Committed load (per member) = sum of `estimate_hours` for items with `commitment_kind = commitment`, non-null estimate, and `team_member_id = that member`.
- Unestimated committed items counted separately; excluded from numeric load.
- Stretch items excluded from committed load; may show informational stretch hours separately.
- Unallocated items never contribute to committed load (cannot be commitments — R12).

**Rationale**: FR-C06, FR-C08, FR-C09; clarify session.

## R5. Period identity

**Decision**: Key planning rows by `period_start` (and `period_end`) using existing `fortnightContaining` / settings weekday. Capacity planning coexists with existing `FortnightPlan` personal selections; shared period dates, separate tables. Next period after close = `fortnightContaining(addDays(periodEnd, 1), weekday)`.

**Rationale**: FR-C01, FR-C15/C16, FR-C19.

## R6. History on close

**Decision**: On explicit close, in one transaction:
1. Write **commitment snapshot** (structured payload) of commitments/stretch at close.
2. Set period `status = closed` + review fields.
3. Optionally duplicate selected incomplete **committed** items into the next open period (create period meta if missing).
4. Live work updates and next-period edits MUST NOT mutate the snapshot.

Closed period plan structure is **read-only** (roster/capacity/work/allocations/kinds); outcome/carryover/trade-off notes remain editable. No reopen in MVP.

**Rationale**: FR-C12, FR-C19, SC-C04, SC-C08.

## R7. Persistence

**Decision**: New migration `002_capacity_planning.sql` on existing SQLite; repositories via `DbSession`; transactional close (snapshot + status + optional carry-forward copies + optional next-period create).

**Rationale**: Constitution VII; 002 Runtime Composition.

## R8. Conflicts (soft gate)

**Decision**: Warnings are first-class (`CAPACITY_OVERLOAD`, `COMMIT_BLOCKED_ITEM`, `COMMIT_UNKNOWN_ESTIMATE`).
- **`planning.allocate`**: Persists the selection when valid (including conflicted commitments); response includes `warnings` + `planConflicted`. No `acceptWarnings` flag. UI MUST confirm before invoking allocate when the resulting plan would be conflicted (or when changing into a warned commitment).
- **`planning.periodClose`**: If warnings remain, requires `acceptWarnings=true` or returns warning errors.
- `planConflicted` stays true until underlying conflicts are removed; acknowledgment never means “clean.”

**Rationale**: FR-C10, SC-C03; analyze remediation I1 (align plan vs contract).

## R9. Carry-forward copy

**Decision**: On close, UI/API accepts optional `carryForwardWorkItemIds`.
- **Eligible (“incomplete commitment”)**: `commitmentKind = commitment` AND `status ∉ {done, dropped}` (includes `ready`, `blocked`, `waiting_external`).
- Copies are **new** `CandidateWorkItem` rows in the next period with title, priority, estimate/unknown, applicationId, dependencyNotes; status defaults to `ready` (or preserve `blocked`/`waiting_external` if still blocked); allocation starts unallocated with `commitment_kind = none`; optional `carriedFromWorkItemId` for traceability.
- Stretch/neither not offered. If next period meta missing, auto-create open period.

**Rationale**: FR-C19, SC-C08; clarify Q3/Q5; analyze remediation U1.

**Alternatives considered**: Notes-only (rejected by clarify); automatic copy of all incomplete (rejected).

## R10. Commitment requires assignee

**Decision**: `commitment_kind = commitment` is invalid when `team_member_id` is null. Error `COMMIT_REQUIRES_ASSIGNEE`. Unallocated may be `stretch` or `none` only.

**Rationale**: FR-C08; clarify Q4.

## R11. Work title vs description

**Decision**: Single required `title` field (max 4000) is the work description. No separate `description` column in MVP.

**Rationale**: Analyze remediation U2; keeps schema minimal while satisfying FR-C05 intent.

## Out of scope (confirmed)

- Jira import, auto-scheduling, multi-user sync, story points, reopen-closed, working-day calendar UI, CSP changes unrelated to feature
