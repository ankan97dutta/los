# Implementation Plan: Focus, Reports and a Calmer LOS

**Branch**: `feature/006-focus-reports-ux-refresh` (git) | **Feature dir**: `specs/005-focus-reports-ux-refresh` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-focus-reports-ux-refresh/spec.md`, including all 2026-10-20 clarify sessions (12 answers, all binding).
**Plan refresh (2026-10-20, after analyze)**: Folds in the five analysis fixes (section Undo, header watcher, full copy inventory, covers to today exports, technique saved at session start), the notification content decision (generic by default), the focus counted rule (counts at timer end), and plan level decisions for report range overlap, legacy action dating, and theme initialisation before render.

**Baselines**: Constitution v1.1.0; 001 to 004 complete on this branch line. No schema, domain rule or route from 001 to 004 is weakened. Existing stack only: React 19, TypeScript 5, Tauri 2, SQLite via current persistence, CSS custom properties. One new Tauri plugin is added for notifications (see R3 in [research.md](./research.md)).

> **Numbering note**: Spec artifacts live under `005-*`. Git branch is `feature/006-focus-reports-ux-refresh`, created by the git hook. Keep the directory as 005.

## Summary

Four workstreams on the existing monorepo, in spec priority order:

1. **Focus mode (P1)**: A persisted focus session with wall clock deadlines, Pomodoro, Deep work and Custom techniques, shown as an overlay over the current page. Domain timer rules stay pure and testable. One active session at a time. A block counts at the moment its timer ends, whatever happens next. End of block is announced in words, with sound, and with a system notification when LOS is in the background. That notification is generic by default ("Focus block done") and only names the task if the lead turns that on. A header timer watches the session while the overlay is closed and fires the end alert exactly once.
2. **MBR and QBR reports (P1)**: A Reports tab inside Reviews. A deterministic builder in the domain layer turns local data for one month or one quarter into an editable draft. Refresh rebuilds only sections the lead has not edited. Copy as clean text and print are the only outputs.
3. **Calmer UX and human copy (P2)**: Insight first pass on the primary screens, measured step counts for five everyday jobs before and after, and a full copy rewrite guarded by an automated check that fails on em dash, en dash and banned stock phrases in user facing text.
4. **Orange and red primary colors (P3)**: Appearance (Dark or Light) and Primary color (Default, Ember orange, Signal red) become two separate choices, stored apart, applied through the existing token system.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Rust (edition 2021) for the Tauri shell only

**Primary Dependencies**: Existing `@los/domain`, `@los/app-services`, `@los/persistence`, Tauri 2, Vite 6. New: `tauri-plugin-notification` v2 plus `@tauri-apps/plugin-notification`, used only for focus end notifications. No UI framework, no charting, no markdown library (report copy output is plain text built by string join).

**Storage**: SQLite schema **version 5** (from current 4): `focus_sessions`, `report_drafts`, `report_sections`, plus seven focus preference columns on `workspace_settings` (last technique, custom focus and break minutes, long break minutes, sound on, notifications on, include task name in notifications off by default). Same SQL mirrored in `packages/persistence/migrations/005_focus_reports.sql` and `MIGRATION_SCRIPTS` in `migrations_embedded.ts`; `APP_MAX_SCHEMA_VERSION` rises to 5. Preview `MemoryStore` snapshot gains matching collections with normalize defaults so old preview JSON still loads. Appearance and primary color stay in `localStorage` like the current theme, never in SQLite.

**Testing**: Vitest per package (`packages/domain/tests`, `packages/app-services/tests`, `packages/persistence/tests`, desktop `src/**/*.test.ts`). New suites for focus timer transitions, report period math, report build and refresh merge, migration 5, backup and restore round trip with new tables, and theme pairing. Manual verification per [quickstart.md](./quickstart.md), recorded in `checklists/verification-evidence.md`.

**Target Platform**: macOS first desktop through Tauri (current `tauri.conf.json` 1200 by 800, min 1024 by 680). Vite browser preview remains a supported dev surface with honest unavailable wording for notifications. No mobile, no web deployment.

**Project Type**: Desktop app feature on the existing pnpm monorepo (`apps/desktop` plus shared packages)

**Performance Goals**: Timer tick renders at most once per second and only inside the overlay or the running chip. Report generation for one quarter completes in under 1 second on a year of personal data. Theme switch is instant with no reload. Copy check runs in under 5 seconds.

**Constraints**: Fully offline. No account, telemetry or LLM call anywhere in these flows. Deterministic report content: same data in, same draft out. One active focus session. Refresh never overwrites an edited report section. Status meaning never carried by color alone, which matters most in Signal red (danger) and Ember orange (warning, conflicted). All new and reviewed copy passes the dash and phrase check.

**Scale/Scope**: Personal single user data. Focus history grows by a handful of rows per day. Report drafts are one per type and period. Touch set is listed in Project Structure; no new package is created.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Disposition |
|------|-------------|
| Offline core | Pass. Timer, reports, copy and themes need no network. Notification plugin is local OS only. |
| No LLM required | Pass. Report builder is a deterministic template over local data. No AI call is made or offered in this feature. |
| Privacy default | Pass. Focus and report data stay in the local database and in SQLite backups the user exports. Notifications are generic by default and carry task wording only when the lead explicitly turns that on; they can be turned off entirely. No telemetry. |
| Adapter isolation | Pass. The notification plugin is wrapped in one desktop helper (`lib/focusNotify.ts`). Denial, absence in preview and plugin errors degrade to in-app words and sound. Domain and app-services never import it. |
| Ownership clarity | Pass. Focus sessions and report drafts are LOS owned personal data. Report figures read external facing LOS records (actions, planning periods) without claiming ownership of anything outside LOS. No sync is added. |
| Modular boundaries | Pass. Timer and report rules live in `@los/domain` with no UI, persistence or Tauri imports. App-services orchestrate repositories. Desktop renders and calls services. |
| Migration safety | Pass with work. Version 5 migration is additive (new tables, new nullable or defaulted settings columns). Backup and restore smoke test must cover the new tables before the feature is called complete. |
| Test evidence | Pass with work. New domain, service and persistence suites named in Technical Context are required, plus quickstart evidence. |
| Spec completeness | Pass. Spec and clarify are done. This plan, data model, contracts and quickstart complete the planning set. Tasks come next. |
| Desktop UX | Pass. Focus overlay is keyboard operable with visible focus and a clear leave path. Running session stays reachable through a header chip. Save, notification and offline states are worded, not color only. |

**Post-design re-check**: One tension was reviewed. Principle X favours native desktop behaviour, and the clarify session chose system notifications, so the Tauri notification plugin is justified as an OS integration that fails soft, matching the existing global shortcut pattern. No gate needs an exception. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-focus-reports-ux-refresh/
├── plan.md              # this file
├── research.md          # Phase 0 decisions R1 to R9
├── data-model.md        # Phase 1 entities, tables, state machine
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   └── focus-reports.md # UI, service and theme contracts
├── checklists/
│   ├── requirements.md  # from specify, revalidated at clarify (16/16)
│   └── verification-evidence.md  # created during implement
└── tasks.md             # next command, not created here
```

### Source Code (repository root)

```text
packages/domain/src/
├── focus.ts             # NEW techniques, session transitions, day summary math
├── reports.ts           # NEW period bounds, section builder, refresh merge
└── ports.ts             # EXTEND repository interfaces (focus, reports, read ranges)

packages/domain/tests/
├── focus.test.ts        # NEW
└── reports.test.ts      # NEW

packages/persistence/
├── migrations/005_focus_reports.sql   # NEW
├── src/migrations_embedded.ts         # EXTEND with version 5 script
├── src/ports.ts                       # APP_MAX_SCHEMA_VERSION 4 to 5
├── src/memory_store.ts                # EXTEND snapshot: focusSessions, reportDrafts, reportSections
├── src/focus_repo.ts                  # NEW SQLite plus memory wiring
├── src/reports_repo.ts                # NEW SQLite plus memory wiring
├── src/repos.ts, src/sqlite_repos.ts  # EXTEND WorkspaceRepos with focus and reports
└── tests/ (migration 5, backup restore, focus and reports repos)  # NEW and EXTEND

packages/app-services/src/
├── focus.ts             # NEW start, pause, resume, end, reconcile, today summary
├── reports.ts           # NEW generate, get, save edits, refresh, period list
├── workspace.ts         # EXTEND settings patch (focus preferences), WorkspaceRepos use
└── index.ts             # EXTEND exports

apps/desktop/
├── scripts/check-copy.mjs   # NEW dash and banned phrase scan over user facing source
├── src/lib/api.ts           # EXTEND focus and report wrappers
├── src/lib/focusNotify.ts   # NEW Tauri notification wrapper with preview fallback
├── src/ui/theme.ts          # EXTEND appearance plus primary color, old key migration
├── src/styles/tokens.css    # EXTEND data-accent token sets for ember and signal
├── src/styles/base.css      # EXTEND overlay, running chip, print rules for reports
├── src/shell/routes.ts      # EXTEND reviews-reports route
├── src/shell/CommandPalette.tsx  # EXTEND Focus group, Go to Reports action
├── src/main.tsx             # EXTEND initTheme plus initAccent before first render
├── src/App.tsx              # EXTEND focus overlay mount, header watcher and chip, palette runs
├── src/features/focus/FocusOverlay.tsx      # NEW
├── src/features/focus/focusView.ts          # NEW pure view helpers plus test
├── src/features/reviews/ReviewsPage.tsx     # EXTEND fourth tab: Reports
├── src/features/reviews/ReportsPanel.tsx    # NEW generate, edit, refresh, copy, print
├── src/features/settings/SettingsPage.tsx   # EXTEND appearance, primary color, focus prefs
├── src/features/reviews/DailyReviewPage.tsx # EXTEND Focus start entry, today focus line
├── src/features/actions/ActionsPage.tsx     # EXTEND per action Focus entry
├── src/features/planning/CapacityPlanPage.tsx  # EXTEND per item Focus entry, insight first pass
└── copy rewrite in place across features/*, shell/Tour.tsx, shell/ShortcutsDialog.tsx

apps/desktop/src-tauri/
├── Cargo.toml               # EXTEND tauri-plugin-notification
├── src/lib.rs               # EXTEND plugin registration
└── capabilities/default.json  # EXTEND notification permissions
```

**Structure Decision**: Follow the 001 to 004 layering exactly. Pure rules in domain, orchestration in app-services, storage behind repository ports with SQLite and memory twins, presentation in desktop. Focus and reports each get one file per layer rather than new packages. The only Rust change is registering the notification plugin, mirroring how the global shortcut plugin is already handled.

## Clarification to design mapping

| Spec decision (2026-10-20) | Design impact |
|----------------------|---------------|
| Reports inside Reviews, no seventh nav item | New `reviews-reports` route and fourth Reviews tab; palette gains Go to Reports; primary nav unchanged |
| Focus is an overlay over a dimmed page | `FocusOverlay` mounted at App level like Tour and palette; page inert behind; Esc and Leave close the overlay without ending the session; header chip reopens it |
| Appearance and primary color are separate choices | `data-theme` keeps dark or light, new `data-accent` carries default, ember or signal; two Settings selects; old `los.ui.theme` value still honoured |
| Refresh updates only unedited sections | `report_sections.edited` flag; domain merge keeps edited bodies word for word and reports which sections changed |
| System notification in background, turn offable | Tauri notification plugin behind `focusNotify.ts`; setting on `workspace_settings`; denied or preview shows honest wording, timer still completes in app |
| Removing an edited section needs confirmation plus Undo (analysis C1) | Panel confirms before removing an edited section; removal writes the existing tombstone row (`removed` 1, `edited` 1); Undo clears the tombstone and restores text, heading and order |
| Header timer watches while overlay is closed (analysis G1) | App level one second watcher mounted beside the overlay: reconcile, live chip countdown, single-fire end notification per session and phase when the overlay is closed or the document is hidden |
| Copy review covers every surface with an inventory (analysis G2) | Copy tasks enumerate all user facing desktop files; verification evidence holds the inventory (rewritten, reviewed, left out with reason) |
| Running period wording appears in exports too (analysis G3) | Display and export end date is today when `periodComplete` is false; builder, copy text and print all use the same line |
| Technique saved at session start (analysis G4) | `focusStart` writes last technique and Custom lengths to focus preferences in the same operation; overlay preselects them next open |
| Notification text is generic by default (analysis A1) | `notifyFocusEnded` sends phase wording only; task label is included only when `focus_notifications_include_task` is on |
| A block counts when its timer ends (analysis U1) | `finishedLocalDate` and capped counted seconds are fixed at the focus deadline; break, next block and close never move them. One session row per sitting |
| Report ranges overlap, legacy actions need a completion date (analysis U2, U3) | Repositories treat all ranges as inclusive; a planning period qualifies when it overlaps the report range; an action counts as completed in a period only when `completedAt` falls inside it. Rows without `completedAt` are never dated by `updatedAt` |
| Theme applies before first render (analysis I2) | `initTheme` and `initAccent` are called in `apps/desktop/src/main.tsx` before `createRoot` renders, not in an App effect |

## Phase 0 and Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/focus-reports.md](./contracts/focus-reports.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Next command

`/speckit-tasks`
