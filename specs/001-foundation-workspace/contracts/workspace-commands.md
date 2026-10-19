# Workspace Commands

All commands return `{ ok: true, data } | { ok: false, error: { code, message } }`.  
Timestamps and IDs are assigned by the service/domain. Local timezone from OS unless overridden in tests.

## Inbox

### `inbox.capture`

```ts
Input:  { description: string }
Output: { item: InboxItemView }  // status=open
Errors: EMPTY_DESCRIPTION | DESCRIPTION_TOO_LONG
```

### `inbox.triage`

```ts
Input:  { id: string, disposition: "convert" | "dismiss" | "keep" }
Output: { item: InboxItemView, action?: PersonalActionView } // action when convert
Errors: NOT_FOUND | INVALID_STATE  // e.g. not open
```

## Personal actions

### `actions.create`

```ts
Input:  { description: string, applicationId?: string | null }
Output: { action: PersonalActionView }
Errors: EMPTY_DESCRIPTION | DESCRIPTION_TOO_LONG | APPLICATION_NOT_FOUND
```

### `actions.update`

```ts
Input:  { id: string, description?: string, applicationId?: string | null }
Output: { action: PersonalActionView }
Errors: NOT_FOUND | EMPTY_DESCRIPTION | APPLICATION_NOT_FOUND
```

### `actions.setStatus`

```ts
Input:  { id: string, status: "open" | "done" }
Output: { action: PersonalActionView }
Errors: NOT_FOUND
```

## Applications

### `applications.rename`

```ts
Input:  { id: string, name: string }
Output: { application: ApplicationView }
Errors: NOT_FOUND | EMPTY_NAME
```

## Daily review

### `daily.upsert`

```ts
Input:  {
  date: string, // YYYY-MM-DD
  outcomes?: string,
  blockers?: string,
  followUps?: string,
  nextActionLines?: Array<{ id: string, sortOrder: number, text: string }>
}
Output: {
  review: DailyReviewView,
  createdActionIds: string[]  // newly materialized from next-action lines
}
Errors: INVALID_DATE | DESCRIPTION_TOO_LONG
```

Autosave calls `daily.upsert` with full editor snapshot. Materialization rules per [data-model.md](../data-model.md).

## Fortnight plan

### `fortnight.upsert`

```ts
Input:  {
  periodStart: string, // YYYY-MM-DD
  commitments?: string,
  selectedActionIds?: string[]  // replaces selection set for plan
}
Output: { plan: FortnightPlanView }
Errors: INVALID_PERIOD | ACTION_NOT_FOUND
```

## Monthly review

### `monthly.upsert`

```ts
Input:  { yearMonth: string, improvementPriorities?: string } // YYYY-MM
Output: { review: MonthlyReviewView }
Errors: INVALID_YEAR_MONTH
```

## Settings

### `settings.update`

```ts
Input:  {
  fortnightStartWeekday?: "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun",
  globalShortcutEnabled?: boolean,
  globalShortcutAccel?: string
}
Output: { settings: SettingsView }
Errors: INVALID_WEEKDAY | INVALID_ACCEL
```

Changing `fortnightStartWeekday` is an explicit user action (FR-018); UI must confirm before apply.
