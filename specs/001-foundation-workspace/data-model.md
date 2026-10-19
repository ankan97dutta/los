# Data Model: Foundational LOS Desktop Workspace

**Feature**: `001-foundation-workspace`  
**Date**: 2026-10-19

## Overview

All entities are **LOS-owned**, local, single-user. No external system provenance in this feature.

## Entities

### Application

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | Stable primary key |
| `slotIndex` | 1..4 | Unique; fixed four slots |
| `name` | string | Non-empty after trim; default `Application {n}` |
| `createdAt` | datetime | Set on seed |
| `updatedAt` | datetime | On rename |

**Lifecycle**: Seeded once on first migration. Cannot delete slots in this feature; rename only.

### InboxItem

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `description` | string | Required; trim; non-empty; max length (e.g. 4000) with explicit error if exceeded |
| `status` | enum | `open` \| `converted` \| `dismissed` |
| `capturedAt` | datetime | Set on create |
| `updatedAt` | datetime | On triage |
| `convertedActionId` | UUID? | Set when converted to PersonalAction |

**Transitions**:
- `open` → `converted` (creates PersonalAction; copies description)
- `open` → `dismissed`
- `open` stays `open` when “keep for later”

**Queries**: Open inbox ordered by `capturedAt` DESC.

### PersonalAction

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `description` | string | Required non-empty |
| `status` | enum | `open` \| `done` |
| `applicationId` | UUID? | FK Application or null (unassigned) |
| `source` | enum | `manual` \| `inbox` \| `daily_next_action` |
| `sourceRef` | string? | e.g. daily lineId or inbox item id |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |
| `completedAt` | datetime? | Set when `done` |

**Transitions**: `open` ↔ `done` (reopen clears `completedAt`).

### DailyReview

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `date` | local date | Unique per day (`YYYY-MM-DD` in user TZ) |
| `outcomes` | text | Free text |
| `blockers` | text | Free text |
| `followUps` | text | Free text |
| `updatedAt` | datetime | Autosave |

### DailyNextActionLine

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK = `lineId` (stable) |
| `dailyReviewId` | UUID | FK |
| `sortOrder` | int | Display order |
| `text` | string | Empty allowed in UI buffer; empty does not create PersonalAction |
| `personalActionId` | UUID? | Set after first successful materialization |

**Rule**: On autosave, for each line with non-empty `text` and no `personalActionId`, create PersonalAction (`source=daily_next_action`, `sourceRef=lineId`) and link. Subsequent autosaves update the linked action’s description if still `open` (optional v1: update description to match line text). Do not delete actions when lines cleared.

### FortnightPlan

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `periodStart` | local date | Inclusive start (anchor weekday) |
| `periodEnd` | local date | Inclusive end (= start + 13 days) |
| `commitments` | text | Free text |
| `updatedAt` | datetime | Autosave |

**Uniqueness**: `(periodStart)` unique.

### FortnightSelection

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `fortnightPlanId` | UUID | FK |
| `personalActionId` | UUID | FK |
| `selectedAt` | datetime | |

**Uniqueness**: `(fortnightPlanId, personalActionId)`. Completing an action does not remove the selection row (historical).

### MonthlyReview

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `yearMonth` | string | `YYYY-MM` local |
| `improvementPriorities` | text | Free text (structured list can be plain lines) |
| `updatedAt` | datetime | Autosave |

**Uniqueness**: `yearMonth`.

### WorkspaceSettings

| Field | Type | Rules |
|-------|------|--------|
| `id` | singleton | Single row |
| `fortnightStartWeekday` | enum | `mon`..`sun`; default `mon` |
| `globalShortcutEnabled` | bool | default true |
| `globalShortcutAccel` | string | platform accelerator string; default TBD in impl |
| `updatedAt` | datetime | |

## Period helpers (domain)

- `localToday(clock, timeZone)` → date
- `fortnightContaining(date, startWeekday)` → `{ periodStart, periodEnd }`
- `monthContaining(date)` → `YYYY-MM`
- Navigation: previous/next fortnight (±14 days from `periodStart`); previous/next day; previous/next month

## Validation summary

- Reject empty inbox capture / empty action description.
- Enforce description max length with user-visible error (no silent truncate).
- Exactly four applications always present after migrations.
- Autosave errors surface `error` status; last good persisted state remains readable.
