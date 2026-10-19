# Data Model: Lead Command Center UX (presentation)

**Feature**: `specs/004-lead-command-ux`  
**Scope**: Presentation-layer entities only. No new SQLite tables for MVP. Domain entities from 001–003 are unchanged consumers.

## DesignTokenSet

Named CSS custom properties grouped by theme.

| Field / group | Description | Validation |
|---------------|-------------|------------|
| `theme` | `"dark"` \| `"light"` | Required; default `"dark"` |
| color | `--bg`, `--bg-elevated`, `--border`, `--text`, `--muted`, `--accent`, … | Contrast readable on both themes |
| semantic status | `--status-ok`, `--status-warning`, `--status-danger`, `--status-unknown`, `--status-conflicted`, `--status-muted` | Paired with text/icon cues (FR-U04) |
| type | `--font`, `--mono`, size/line-height tokens | Expressive stack already started (IBM Plex); refine in tokens |
| space / radius | spacing scale, `--radius` | Consistent across primitives |

**Persistence**: `localStorage["los.ui.theme"]` only (see research R2). Tokens themselves are code.

## ShellRoute

| Field | Type | Notes |
|-------|------|-------|
| `id` | `today` \| `inbox` \| `planning` \| `team` \| `reviews` \| `settings` \| `quick` | Contract ids |
| `label` | string | Nav-visible label |
| `backing` | existing page component(s) | No placeholder-only destinations |
| `keyboardTarget` | boolean | Primary nav items are Tab-reachable |

**Relationships**: Shell owns ordered list of primary routes; palette actions may reference `ShellRoute.id`.

## CommandPaletteAction

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable id |
| `label` | string | Filterable display |
| `run` | `'navigate'` \| `'quick-capture'` | |
| `route` | `ShellRoute.id` optional | Required when `run === 'navigate'` |
| `shortcutHint` | string optional | e.g. display `⌘K` for open |

## SurfaceState

Discriminated UI state for shared patterns:

| State | Typical cue | Used on |
|-------|-------------|---------|
| `loading` | text + muted progress | Inbox, Planning, Reviews |
| `empty` | EmptyState + next action | Inbox, demand list |
| `ready` | content | all |
| `error` | Banner danger + message | validation / save fail |
| `offline` / degraded | LocalStatus + text | shell status region |
| `conflicted` | Banner + text (not color alone) | Planning when plan conflicted |
| `save` | pending \| saved \| failed | SaveIndicator on autosave surfaces |

## SaveIndicatorModel

| Field | Type |
|-------|------|
| `status` | `'idle'` \| `'pending'` \| `'saved'` \| `'failed'` |
| `message` | string optional |

Maps onto existing autosave helpers (`apps/desktop/src/lib/autosave.ts`) without changing persistence semantics.

## Out of model (explicit non-entities)

- No new domain types for CandidateWork, capacity math, freeze, or soft-gate.
- Missing 003 fields (priority, dependency notes editors, etc.) are **not** modeled here; omit UI until Track B exposes them.
