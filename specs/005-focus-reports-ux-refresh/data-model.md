# Data Model: Focus, Reports and a Calmer LOS

**Feature**: `specs/005-focus-reports-ux-refresh` | **Date**: 2026-10-20
**Storage change**: SQLite schema version 5. All changes additive. Preview `MemoryStore` mirrors the same shapes.

## Focus Technique

Not stored per row beyond the session copy. The catalogue is constant in domain:

| Key | Label | Focus | Break | Blocks before long break | Long break |
|-----|-------|-------|-------|--------------------------|------------|
| `pomodoro` | Pomodoro | 25 min | 5 min | 4 | 20 min |
| `deep` | Deep work | 50 min | 10 min | 4 | 20 min |
| `custom` | Custom | lead set, 5 to 180 min | lead set, 5 to 180 min | 4 | lead set, 15 to 30 min |

Validation: custom minutes are whole numbers in range. Out of range input is rejected with a worded error, never clamped silently.

## Focus Session

**Table**: `focus_sessions`. **Preview collection**: `focusSessions`.

| Field | Type | Rules |
|-------|------|-------|
| `id` | text, primary key | Generated at start |
| `taskKind` | text: `action`, `workItem`, `intention` | What the block is about |
| `taskRef` | text, nullable | Personal action id or candidate work item id. Null for intention |
| `taskLabel` | text | Snapshot of the wording at start, so history reads well even if the task is later renamed or done. For intention this is the typed text, 1 to 200 characters |
| `technique` | text: `pomodoro`, `deep`, `custom` | Copied from the choice at start |
| `plannedFocusMinutes` | integer | 5 to 180 |
| `plannedBreakMinutes` | integer | 5 to 180 |
| `longBreakMinutes` | integer | 15 to 30 |
| `blockIndex` | integer | 1 based position in the current set |
| `setSize` | integer | Blocks before a long break, default 4 |
| `status` | text | See state machine |
| `startedAt` | ISO timestamp | Set at start |
| `focusEndsAt` | ISO timestamp, nullable | Deadline while running |
| `pausedRemainingSeconds` | integer, nullable | Remaining focus seconds while paused |
| `pausedAt` | ISO timestamp, nullable | Set on pause, cleared on resume |
| `breakEndsAt` | ISO timestamp, nullable | Deadline while break runs |
| `endedAt` | ISO timestamp, nullable | Set when finished or ended early |
| `countedFocusSeconds` | integer | Never greater than `plannedFocusMinutes * 60` |
| `finishedLocalDate` | local date `YYYY-MM-DD`, nullable | Local day the focus block ended. Drives the day summary and report focus figures |

### State machine

```text
start --> running --pause--> paused --resume--> running
running --deadline reached--> focusDone --start break--> breakRunning --deadline--> breakDone
running or paused --end early--> endedEarly
focusDone --next block--> (new session, blockIndex + 1) or finished when the lead stops
breakDone --next block--> (new session) or finished when the lead stops
```

Rules:

- Break and next block are separate lead choices. The finished session row stays `focusDone` or `breakDone` until the lead starts the next step or leaves, then it is closed as `finished`.
- Counted rule (clarification U1, binding): the instant the focus deadline is reached, `finishedLocalDate` is set to that local day and `countedFocusSeconds` is fixed at the elapsed focus seconds capped by the plan. Later transitions (`breakRunning`, `breakDone`, `finished`, starting the next block) never change either field. A session counts in summaries when `finishedLocalDate` is set and status is not `endedEarly`. There is no second counted state to reconcile.
- After `setSize` finished blocks, the offered break uses `longBreakMinutes` and says so in words.
- Ending early under 60 counted seconds gives `countedFocusSeconds = 0` for summaries. The row is kept as `endedEarly` for honesty.
- Ending a session never touches the linked task. Mark done is an explicit extra choice at the end, calling the existing action status service.
- One session at a time in `running`, `paused` or `breakRunning`, enforced in app-services before start.

### Focus Day Summary

Derived, never stored. From sessions with `finishedLocalDate` equal to the day and status not `endedEarly`: count of those sessions, and sum of `countedFocusSeconds`, shown as minutes rounded down with leftover seconds dropped. Shown in the overlay and on Today.

## Focus Preferences

Columns added to the single row `workspace_settings`:

| Column | Default | Meaning |
|--------|---------|---------|
| `focus_technique` | `pomodoro` | Last used technique key |
| `focus_custom_focus_minutes` | 25 | Custom focus length |
| `focus_custom_break_minutes` | 5 | Custom break length |
| `focus_long_break_minutes` | 20 | Long break, 15 to 30 |
| `focus_sound_enabled` | 1 | End of block tone |
| `focus_notifications_enabled` | 1 | System notifications, Tauri only |
| `focus_notifications_include_task` | 0 | Include task or intention wording in the system notification. Off by default because notifications can show on a lock screen |

Domain `WorkspaceSettings` gains the matching optional fields so older callers keep working. Settings updates go through the existing `settingsUpdate` patch path.

## Report Period

Computed in domain, never stored as a row by itself:

| Type | Bounds | Label example |
|------|--------|---------------|
| `mbr` | First to last day of one calendar month | Monthly review, September 2026 |
| `qbr` | First day of the quarter's first month to last day of its third month | Quarterly review, July to September 2026 |

`periodComplete` is false when today falls inside the bounds. Future periods are not offered. Period keys are the `periodStart` date string.

## Report Draft

**Table**: `report_drafts`, unique on (`reportType`, `periodStart`). **Preview collection**: `reportDrafts`.

| Field | Type | Rules |
|-------|------|-------|
| `id` | text, primary key | |
| `reportType` | text: `mbr`, `qbr` | |
| `periodStart`, `periodEnd` | local dates | From the Report Period computation |
| `periodComplete` | integer 0 or 1 | False means the draft covers the period to today |
| `title` | text | Default is the period label. Lead editable |
| `titleEdited` | integer 0 or 1 | Set on first lead change |
| `summary` | text | Generated factual paragraph, then lead editable |
| `summaryEdited` | integer 0 or 1 | Set on first lead change |
| `generatedAt` | ISO timestamp | Last generation or refresh |
| `updatedAt` | ISO timestamp | Last change of any kind |

## Report Section

**Table**: `report_sections`, unique on (`draftId`, `sectionKey`). **Preview collection**: `reportSections`.

| Field | Type | Rules |
|-------|------|-------|
| `id` | text, primary key | |
| `draftId` | text, foreign key | |
| `sectionKey` | text | One of `highlights`, `delivery`, `focus`, `risks`, `decisions`, `priorities`, or `custom-<id>` for lead added sections |
| `heading` | text | Plain wording, checked by the copy scan |
| `body` | text | Plain text. May be the honest empty wording |
| `sourceKind` | text: `reviewNotes`, `planning`, `focusRecords`, `lead` | `lead` for added sections |
| `edited` | integer 0 or 1 | Set on first lead change. Refresh honours it |
| `sortOrder` | integer | Fixed order for generated sections, then lead sections in add order |
| `updatedAt` | ISO timestamp | |

Refresh merge (domain, pure): regenerate sections, then for every key present in both, keep the stored body when `edited` is 1, else take the fresh body. Lead added sections always survive. Returns `updatedSectionKeys` so the UI can name what changed.

Deletion and Undo: removing a section never hard deletes. It keeps a tombstone row with the last body, heading and sort order, `edited = 1` and `removed = 1`. Removing an edited section requires confirmation in the panel first; every removal offers Undo, which sets `removed` back to 0 and restores the section exactly. A tombstoned section is not resurrected by refresh.

Report range membership: all ranges are inclusive. A closed planning period belongs to a report when its period overlaps the report range. An action belongs to the completed list only when `completedAt` falls inside the range; done rows without `completedAt` are excluded from dated counts and lists. When `periodComplete` is false, the effective end date for labels, copy text and print is today, never the stored future `periodEnd`.

## Theme Choice

No table. Two `localStorage` keys:

| Key | Values | Default |
|-----|--------|---------|
| `los.ui.theme` (existing) | `dark`, `light` | `dark` |
| `los.ui.accent` (new) | `default`, `ember`, `signal` | `default` |

Applied as `data-theme` and `data-accent` on the document root before first paint where the current code already applies theme.

## Migration and backup notes

- Migration 5 creates the three tables and adds the six settings columns with defaults, so existing rows need no backfill.
- `APP_MAX_SCHEMA_VERSION` becomes 5. A database at 5 opened by an older build keeps the existing too new protection.
- SQLite export copies the whole file, so focus history and report drafts travel with backup. Preview JSON export carries the new collections through snapshot normalize.
- Reset returns all three tables to empty through the existing empty snapshot and, for Tauri, the existing file reset path.
