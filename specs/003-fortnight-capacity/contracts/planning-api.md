# Planning API Contract (003)

In-process app-services commands (same Result envelope as 001: `{ ok, data } | { ok: false, error: { code, message, details? } }`). No new mandatory Tauri invokes beyond existing `DbSession` path.

## Period

### `planning.periodGet`

```ts
Input:  { periodStart?: string } // default: current fortnight
Output: {
  period: {
    periodStart, periodEnd, status,
    tradeoffNotes, outcomeSummary, carryoverNotes,
    warningsAcknowledgedAt?, closedAt?,
    planConflicted: boolean  // true while overload/blocked/unknown commitment conflicts exist
  },
  capacitySummary: {
    members: Array<{
      teamMemberId, displayName,
      availableHours, leaveHours, reservedCommitmentHours, unplannedBufferHours,
      netHours, committedLoadHours, remainingHours, unestimatedCommitCount, stretchHours
    }>,
    totals: { netHours, committedLoadHours, remainingHours, unestimatedCommitCount, unallocatedCount }
  },
  warnings: Array<{ code, message, workItemId?, teamMemberId? }>
}
```

### `planning.periodSaveMeta`

```ts
Input:  { periodStart, tradeoffNotes?, outcomeSummary?, carryoverNotes? }
Output: { period }
Errors: INVALID_PERIOD
// Allowed while closed (notes only). Does not reopen or mutate plan structure.
```

### `planning.periodClose`

```ts
Input:  {
  periodStart,
  outcomeSummary?,
  carryoverNotes?,
  acceptWarnings?: boolean,
  carryForwardWorkItemIds?: string[]  // commitment + status not done/dropped
}
Output: {
  period,
  snapshotId,
  nextPeriodStart?,           // set when carry-forward ran
  carriedForwardCount: number
}
Errors:
  INVALID_PERIOD
  | CAPACITY_OVERLOAD
  | COMMIT_BLOCKED_ITEM
  | COMMIT_UNKNOWN_ESTIMATE
  | CARRY_FORWARD_INVALID     // id not eligible (not commitment, or status done/dropped, or wrong period)
// Soft gate on close: overload/blocked/unknown require acceptWarnings=true.
// Already-closed: idempotent success (same snapshotId); do not wipe notes.
// If carryForwardWorkItemIds non-empty and next period missing, create next open period.
```

## Roster & capacity

### `planning.membersList` / `planning.memberUpsert`

```ts
memberUpsert Input: { id?, displayName, active? }
Errors: VALIDATION_ERROR
// Global roster upsert allowed anytime; period capacity rows still PERIOD_CLOSED-gated.
```

### `planning.capacityUpsert`

```ts
Input: {
  periodStart,
  teamMemberId,
  availableHours, leaveHours, reservedCommitmentHours, unplannedBufferHours
}
Output: { capacity, netHours }
Errors: VALIDATION_ERROR | PERIOD_CLOSED | MEMBER_NOT_FOUND
```

## Demand & allocation

### `planning.workUpsert` / `planning.workList`

```ts
workUpsert Input: {
  id?, periodStart, title, priority,
  estimateHours?, estimateUnknown?,
  actualHours?, applicationId?, status, dependencyNotes?
}
Errors: VALIDATION_ERROR | PERIOD_CLOSED
```

### `planning.allocate`

```ts
Input: { workItemId, teamMemberId: string | null, commitmentKind: 'none' | 'commitment' | 'stretch' }
Output: {
  allocation,
  warnings,
  planConflicted: boolean
}
Errors:
  PERIOD_CLOSED
  | WORK_NOT_FOUND
  | MEMBER_NOT_FOUND
  | COMMIT_REQUIRES_ASSIGNEE   // commitmentKind=commitment with null teamMemberId
// No acceptWarnings flag. Persists valid allocations including conflicted commitments.
// UI must confirm before calling when the resulting plan would be conflicted.
```

## History

### `planning.historyGet`

```ts
Input:  { periodStart }
Output: { period, snapshot }
Errors: NOT_FOUND
```

## Warning / error codes

| Code | Meaning |
|------|---------|
| `CAPACITY_OVERLOAD` | Committed load &gt; net hours for a member |
| `COMMIT_BLOCKED_ITEM` | Commitment on blocked/waiting_external item |
| `COMMIT_UNKNOWN_ESTIMATE` | Commitment on unestimated item |
| `COMMIT_REQUIRES_ASSIGNEE` | Commitment without team member |
| `MEMBER_INACTIVE` | Allocation to inactive member |
| `PERIOD_CLOSED` | Structural edit on closed period |
| `CARRY_FORWARD_INVALID` | Carry-forward id not eligible (`commitment` required; status must not be `done` or `dropped`) |
