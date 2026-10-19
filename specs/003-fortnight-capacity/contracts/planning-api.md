# Planning API Contract (003)

In-process app-services commands (same Result envelope as 001: `{ ok, data } | { ok: false, error: { code, message, details? } }`). No new mandatory Tauri invokes beyond existing `DbSession` path.

## Period

### `planning.periodGet`

```ts
Input:  { periodStart?: string } // default: current fortnight
Output: {
  period: { periodStart, periodEnd, status, tradeoffNotes, outcomeSummary, carryoverNotes, closedAt? },
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
Errors: INVALID_PERIOD | PERIOD_CLOSED
```

### `planning.periodClose`

```ts
Input:  { periodStart, outcomeSummary?, carryoverNotes?, acceptWarnings?: boolean }
Output: { period, snapshotId }
Errors: INVALID_PERIOD | ALREADY_CLOSED | CAPACITY_OVERLOAD | COMMIT_BLOCKED_ITEM | COMMIT_UNKNOWN_ESTIMATE
// Overload/blocked/unknown on commitments require acceptWarnings=true to proceed
```

## Roster & capacity

### `planning.membersList` / `planning.memberUpsert`

```ts
memberUpsert Input: { id?, displayName, active? }
Errors: VALIDATION_ERROR
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
Output: { allocation, warnings }
Errors: PERIOD_CLOSED | WORK_NOT_FOUND | MEMBER_NOT_FOUND
```

## History

### `planning.historyGet`

```ts
Input:  { periodStart }
Output: { period, snapshot }
Errors: NOT_FOUND
```

## Warning codes

| Code | Meaning |
|------|---------|
| `CAPACITY_OVERLOAD` | Committed load &gt; net hours for a member or total |
| `COMMIT_BLOCKED_ITEM` | Commitment on blocked/waiting_external item |
| `COMMIT_UNKNOWN_ESTIMATE` | Commitment on unestimated item |
| `MEMBER_INACTIVE` | Allocation to inactive member |
