# UI Shell Contract (004)

Presentation-only contracts. No new Tauri invokes required for MVP chrome.

**Feature dir**: `specs/004-lead-command-ux`  
**Git branch**: `feature/005-lead-command-ux`  
**Aligned to**: clarify session 2026-10-19 + modern minimalism plan refresh (R8)

## Primary routes

| id | Label | Backing |
|----|-------|---------|
| `today` | Today | Daily review (`DailyReviewPage`) |
| `inbox` | Inbox | Inbox (`InboxPage`) + secondary Actions |
| `planning` | Planning | Capacity planning (`CapacityPlanPage`); personal fortnight secondary |
| `team` | Team | Section sub-nav: Roster \| Applications |
| `reviews` | Reviews | Section sub-nav: Monthly \| Planning history |
| `settings` | Settings | Settings (`SettingsPage`) |
| `quick` | (palette/tray) | QuickCapture |

Primary nav MUST expose the six labeled destinations (not Quick, not Actions). Legacy route ids may alias during migration.

## Secondary / section destinations

| id | Parent | Label | Backing |
|----|--------|-------|---------|
| `actions` | `inbox` | Actions | `ActionsPage` (Inbox sub-nav / section link) |
| `team-roster` | `team` | Roster | Capacity team-members UI (extract or embed from capacity roster) |
| `team-apps` | `team` | Applications | `ApplicationsPage` |
| `reviews-monthly` | `reviews` | Monthly | `MonthlyReviewPage` |
| `reviews-history` | `reviews` | Planning history | Closed-period snapshot access (dedicated Reviews entry; Planning may still disclose active-period history) |
| `planning-fortnight` | `planning` | Fortnight | `FortnightPlanPage` (secondary disclosure/sub-nav) |

## Theme

```ts
type UiTheme = 'dark' | 'light';
// Persist: localStorage['los.ui.theme']
// Apply: document.documentElement.dataset.theme = theme
```

Default: `dark`. Toggle control lives in Settings (optional shell affordance allowed).

## Visual / density contract (modern minimal)

| Rule | Requirement |
|------|-------------|
| Shell | Slim sidebar; brand + primary nav + LocalStatus; no stat strips or promo chrome |
| Surfaces | One title + optional one-line lede; essential content first |
| Chrome | Prefer spacing/dividers over stacked bordered cards for passive lists |
| Elevation | Elevated panels allowed for interactive clusters (forms, palette, confirms) |
| Status honesty | Conflict / error / unknown / save / closed cues MUST remain text-visible (never color-only, never removed for aesthetics) |
| Motion | Palette + optional theme/route transition only; short duration; no decorative loops |
| Anti-patterns | No purple-indigo default theme, glow stacks, pill clusters, emoji chrome, multi-layer shadows |

## Command palette actions

```ts
type RouteId =
  | 'today'
  | 'inbox'
  | 'actions'
  | 'planning'
  | 'team'
  | 'team-roster'
  | 'team-apps'
  | 'reviews'
  | 'reviews-monthly'
  | 'reviews-history'
  | 'settings'
  | 'quick';

type PaletteAction = {
  id: string;
  label: string;
  run: 'navigate' | 'quick-capture';
  route?: RouteId;
};
```

Palette MUST include Personal Actions and primary destinations + Quick Capture.

Documented open shortcut: `Meta+K` (macOS) / `Ctrl+K` (other). Escape closes. Empty filter results use shared empty pattern (not blank dialog).

## Surface states

`loading` | `empty` | `ready` | `error` | `conflicted` (planning) | save `pending`/`saved`/`failed` — each with an explicit text cue (FR-U04 / FR-U08).

Closed planning period: frozen structure uses **read-only presentation** (non-focusable edit controls + clear closed cue); notes/history interactive only per 003.

## UX flow contract (minimal path)

| Flow | Contract |
|------|----------|
| Capture → plan | Keyboard: open Inbox → capture → navigate Planning (SC-U01); palette may shortcut either hop |
| Empty → action | EmptyState names exactly one primary next action |
| Conflicted plan | Conflict banner stays visible after soft-gate ack; secondary history remains disclosable |
| Closed period | Structure read-only; notes/history per 003 |

## Window sizing (FR-U13)

| | Size |
|--|------|
| Default (target) | ≥ 1200 × 800 |
| Practical minimum | ≥ 1024 × 680 |

Prefer Tauri `minWidth`/`minHeight` when supported; otherwise document + verify manually. Record in `checklists/verification-evidence.md`.

## Contrast (SC-U04)

Manual spot-check of body text, muted text, and danger/warning/unknown/conflicted status cues on Inbox + Planning for both themes; notes in verification-evidence (no formal WCAG tool). Re-check after minimalism polish if token backgrounds change.

## Non-goals

- New invoke commands for theme or palette
- Fake controls for unimplemented 003 fields
- Domain schema or capacity formula changes
- Seventh primary nav item for Actions
- Dashboard widget chrome or new product modules
