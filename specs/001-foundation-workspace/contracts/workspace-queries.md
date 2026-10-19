# Workspace Queries

Read models for UI. No side effects.

## `inbox.listOpen`

```ts
Input:  {}
Output: { items: InboxItemView[] } // capturedAt DESC
```

## `actions.list`

```ts
Input:  { status?: "open" | "done" | "all", applicationId?: string | null }
Output: { actions: PersonalActionView[] }
```

## `applications.list`

```ts
Input:  {}
Output: { applications: ApplicationView[] } // slotIndex ASC; always length 4
```

## `daily.get`

```ts
Input:  { date: string }
Output: { review: DailyReviewView | null } // null → empty editor
```

## `fortnight.get`

```ts
Input:  { periodStart?: string } // omit → current fortnight from settings + clock
Output: { plan: FortnightPlanView, period: { start: string, end: string } }
```

## `fortnight.currentPeriod`

```ts
Input:  { asOf?: string } // date; default today
Output: { start: string, end: string, startWeekday: string }
```

## `monthly.get`

```ts
Input:  { yearMonth?: string } // omit → current month
Output: { review: MonthlyReviewView | null, yearMonth: string }
```

## `settings.get`

```ts
Input:  {}
Output: { settings: SettingsView }
```

## `workspace.status`

```ts
Input:  {}
Output: {
  mode: "local_only",
  trayAvailable: boolean,
  globalShortcutAvailable: boolean,
  globalShortcutRegistered: boolean
}
```

Used for “Local only” indicator and degraded tray/shortcut messaging (FR-015, FR-021).

## Shared view shapes (informative)

```ts
type InboxItemView = {
  id: string
  description: string
  status: "open" | "converted" | "dismissed"
  capturedAt: string // ISO
  convertedActionId?: string
}

type PersonalActionView = {
  id: string
  description: string
  status: "open" | "done"
  applicationId: string | null
  source: "manual" | "inbox" | "daily_next_action"
  createdAt: string
  completedAt?: string
}

type ApplicationView = {
  id: string
  slotIndex: 1 | 2 | 3 | 4
  name: string
}

type DailyReviewView = {
  date: string
  outcomes: string
  blockers: string
  followUps: string
  nextActionLines: Array<{ id: string, sortOrder: number, text: string, personalActionId?: string }>
  updatedAt?: string
}

type FortnightPlanView = {
  periodStart: string
  periodEnd: string
  commitments: string
  selectedActionIds: string[]
  updatedAt?: string
}

type MonthlyReviewView = {
  yearMonth: string
  improvementPriorities: string
  updatedAt?: string
}

type SettingsView = {
  fortnightStartWeekday: string
  globalShortcutEnabled: boolean
  globalShortcutAccel: string
}
```
