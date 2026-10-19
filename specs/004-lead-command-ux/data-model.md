# Data Model: Lead Command Center UX (presentation)

**Feature**: `specs/004-lead-command-ux`  
**Scope**: Presentation-layer entities only. No new SQLite tables for MVP. Domain entities from 001–003 are unchanged consumers.

## DesignTokenSet

Named CSS custom properties grouped by theme.

| Field / group | Description | Validation |
|---------------|-------------|------------|
| `theme` | `"dark"` \| `"light"` | Required; default `"dark"` |
| color | `--bg`, `--bg-elevated`, `--border`, `--text`, `--muted`, `--accent`, … | Contrast readable on both themes; accent used sparingly |
| semantic status | `--status-ok`, `--status-warning`, `--status-danger`, `--status-unknown`, `--status-conflicted`, `--status-muted` | Paired with text/icon cues (FR-U04) |
| type | `--font`, `--mono`, size/line-height tokens | IBM Plex stack; clear `h1` / body / muted hierarchy |
| space / radius | `--space-1`…`--space-5`, `--radius` | Consistent across primitives; prefer spacing over boxes |
| density | Optional `--sidebar-width`, `--content-max`, `--motion-fast` | Support slim shell + short transitions (R8) |

**Persistence**: `localStorage["los.ui.theme"]` only (see research R2). Tokens themselves are code.

**Minimal surface rules** (presentation, not persisted):

- Default list/row: divider or spacing, not a card border unless the row is an interactive control cluster.
- Elevated background (`--bg-elevated`) reserved for sidebar, palette, focused forms—not every list item.

## ShellRoute

| Field | Type | Notes |
|-------|------|-------|
| `id` | `today` \| `inbox` \| `planning` \| `team` \| `reviews` \| `settings` \| `quick` | Contract ids |
| `label` | string | Nav-visible label |
| `backing` | existing page component(s) | No placeholder-only destinations |
| `keyboardTarget` | boolean | Primary nav items are Tab-reachable |

**Relationships**: Shell owns ordered list of primary routes; palette actions may reference `ShellRoute.id`.

## SurfaceLayout (presentation convention)

| Field | Description |
|-------|-------------|
| `title` | Single page title |
| `lede` | Optional one-line purpose |
| `primaryRegion` | Essential decisions / lists / capture |
| `statusRegion` | Banners, StatusCue, SaveIndicator (never omitted for aesthetics) |
| `secondaryRegion` | Collapsible detail (history payload, advanced notes) |

Used as a layout checklist for Inbox, Planning, Today, Team, Reviews, Settings—not a runtime type.

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
| `empty` | EmptyState + **one** next action | Inbox, demand list |
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

## CapabilityStatusCue

Presentation model for LocalStatus tray/shortcut lines (FR-U14). Not persisted.

| Field | Type | Notes |
|-------|------|-------|
| `cause` | `'preview'` \| `'os-unavailable'` \| `'registration-failed'` \| `'available'` | Derived from Tauri presence + capability flags |
| `channel` | `'tray'` \| `'shortcut'` | |
| `label` | string | Canonical phrase per research R9 / FR-U14 |
| `detail` | string optional | Registration error text when present |

**Transitions (shortcut)**:

```text
preview → (enter Tauri) → available | registration-failed | os-unavailable
registration-failed → available  (after successful re-register)
available → registration-failed (OS deny / settings re-register fail)
```

**Validation**: Preview MUST NOT render bare `unavailable`. Settings MUST NOT own these labels.

## Out of model (explicit non-entities)

- No new domain types for CandidateWork, capacity math, freeze, or soft-gate.
- Missing 003 fields (priority, dependency notes editors, etc.) are **not** modeled here; omit UI until Track B exposes them.
- No dashboard “stat strip” entity—capacity summary stays a compact Planning region, not a global chrome widget.
