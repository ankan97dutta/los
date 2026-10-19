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
  carryForwardWorkItemIds?: string[]  // incomplete committed items only
}
Output: {
  period,
  snapshotId,
  nextPeriodStart?,           // set when carry-forward ran
  carriedForwardCount: number
}
Errors:
  INVALID_PERIOD
  | ALREADY_CLOSED            // idempotent success preferred; if error, must not wipe notes
  | CAPACITY_OVERLOAD
  | COMMIT_BLOCKED_ITEM
  | COMMIT_UNKNOWN_ESTIMATE
  | CARRY_FORWARD_INVALID     // id not incomplete commitment in this period
// Soft gate: overload/blocked/unknown require acceptWarnings=true to proceed.
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
| `CARRY_FORWARD_INVALID` | Carry-forward id not eligible |
