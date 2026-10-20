# Research: Focus, Reports and a Calmer LOS

**Feature**: `specs/005-focus-reports-ux-refresh` | **Git branch**: `feature/006-focus-reports-ux-refresh`
**Date**: 2026-10-20
**Status**: Phase 0 complete, refreshed 2026-10-20 after two analyze runs and 12 clarifications. All Technical Context items decided, with no unresolved items.

## R1. Timer engine: wall clock deadlines, not counted ticks

**Decision**: A focus session stores real timestamps: `focusEndsAt`, `breakEndsAt`, and `pausedRemainingSeconds` when paused. Pure functions in `packages/domain/src/focus.ts` take `now` as an input and return the current phase and remaining seconds. The desktop re-renders once per second for display only. Counting never depends on how many ticks fired, so sleep, a busy UI or a closed app cannot stretch or shrink a block.

**Rationale**: Spec FR-010 and SC-003 require correct remaining time after close and reopen, and counted time that never exceeds the planned block. Deadline arithmetic gives that for free. Pure functions with injected `now` match the existing domain style (capacity and periods already work this way) and are trivially testable.

**Alternatives considered**: Interval counting in the overlay (rejected: drifts, dies on unmount, fails SC-003). Counting in Rust (rejected: splits the rule across the boundary for no user gain). Storing only elapsed seconds (rejected: cannot reconcile after the app closes).

## R2. Session lifecycle and the one active rule

**Decision**: Session states are `running`, `paused`, `focusDone`, `breakRunning`, `breakDone`, `finished`, `endedEarly`. Transitions live in domain. App-services enforce one session in the active set (`running`, `paused`, `breakRunning`) by checking before every start, inside the existing transaction helper where the runtime provides one. On boot and on overlay open, `focusReconcile` runs once: an expired `running` session becomes `focusDone` with counted minutes capped at the plan, an expired `breakRunning` becomes `breakDone`. One session row covers one sitting, through its break and closing. The counted rule is fixed (clarification U1): when the focus deadline is reached, `finishedLocalDate` and the capped `countedFocusSeconds` are written once and never change afterwards. Break, next block and close choices cannot add, remove or move the count. The day summary counts a session when its status is `focusDone`, `breakRunning`, `breakDone` or `finished` and `finishedLocalDate` equals the day; `endedEarly` never counts. While the overlay is closed, an App level watcher ticks once per second: it reconciles, keeps the header chip counting down, and fires the end alert exactly once per session and phase (clarification G1). Starting a session also writes the last technique and Custom lengths to focus preferences in the same operation, so the next open preselects them (clarification G4).

**Rationale**: Matches FR-007, FR-008 and the sleep and clock edge cases. Reconcile on read keeps every surface honest without a background daemon.

**Alternatives considered**: A database unique index for the active session (rejected for now: SQLite partial indexes cannot express one row across several states cleanly, and the service check plus tests cover a single user app). Auto starting the break or next block at reconcile (rejected: spec says nothing auto starts, ever).

## R3. Notifications: Tauri plugin behind a desktop wrapper

**Decision**: Add `tauri-plugin-notification` v2 (Rust) and `@tauri-apps/plugin-notification` (JS), register in `src-tauri/src/lib.rs`, add `notification:default` to `capabilities/default.json`. All use goes through `apps/desktop/src/lib/focusNotify.ts`, dynamically imported and guarded by the existing `isTauriRuntime` check, in the same style as the shortcut re-registration in `App.tsx`. Permission is requested lazily at the first session start with the setting on. Outcomes:

| Situation | Behaviour |
|-----------|-----------|
| Tauri, permission granted, app in background | System notification for the ended phase. Generic wording by default ("Focus block done", "Break done"); the task or intention name is included only when the separate include task name setting is on (clarification A1, off by default, because notifications can appear on a lock screen) |
| Tauri, denied or error | No notification. Overlay and Settings show "System notifications are unavailable. In-app alerts still work." Timer completes normally |
| Vite preview | Focus settings show "Notifications: n/a (browser preview)". In-app words and sound only |

Sound is a short generated tone through WebAudio in the overlay, with a mute setting. No audio asset is shipped. In-app wording plus `aria-live` always fires, muted or not.

**Rationale**: Clarification 5 chose system notifications. The plugin is the official Tauri path and keeps Rust changes to three lines, matching the global shortcut precedent (Principle IV: failure at the edge never breaks the core). The domain and services never see it.

**Alternatives considered**: Browser `Notification` API inside the webview (rejected: unreliable in Tauri webviews, and preview would behave differently from the shipped app). Tray icon flash or window badge only (rejected: easy to miss, and the user asked to be told). No plugin, in-app only (rejected: contradicts the clarification).

## R4. Focus and report storage: schema version 5

**Decision**: Additive migration 5 (full field list in [data-model.md](./data-model.md)):

- `focus_sessions` for every session, kept as history.
- Focus preferences as columns on the existing single row `workspace_settings`: last technique, custom focus and break minutes, long break minutes, sound on, notifications on, and include task name in notifications (default off).
- `report_drafts` plus `report_sections` (one row per section, with `edited` flag), unique per report type and period start.
- `APP_MAX_SCHEMA_VERSION` moves 4 to 5 in `packages/persistence/src/ports.ts`, the SQL file `migrations/005_focus_reports.sql` is added, and the same SQL is embedded in `migrations_embedded.ts`. Memory snapshot gains `focusSessions`, `reportDrafts`, `reportSections` arrays with normalize defaults, so preview data and old backups keep loading. SQLite file backup and restore then cover the new tables with no extra code, which FR-030 requires. Reset uses the existing empty snapshot path.

**Rationale**: Repositories already follow this exact pattern for planning (migration 2). Report sections as rows make the refresh merge (R6) a simple per section decision instead of JSON surgery.

**Alternatives considered**: Sections as one JSON payload like `commitment_snapshots` (rejected: refresh merge and edited tracking get fiddly). Focus preferences in `localStorage` (rejected: Settings is the home for workspace preferences, and backup should carry them; theme stays in `localStorage` only because 004 set that precedent for pure chrome).

## R5. Report figures: reuse services, never recompute quietly

**Decision**: `packages/app-services/src/reports.ts` gathers, for the picked period:

| Report section | Source | Honest fallback |
|-----------|--------|-----------------|
| Highlights and wins | Daily review outcomes in range, done actions whose `completedAt` falls inside the range | "No completed work recorded in this period." |
| Delivery and capacity | Closed planning periods overlapping the range, read through the existing `planningPeriodGet` and `planningHistoryGet` so totals and warnings match Planning exactly | "No closed planning periods in this period." |
| Focus and workload | `focus_sessions` finished in range: blocks, minutes, by technique | "No focus sessions recorded in this period." |
| Risks and blockers | Daily review blockers in range, warnings from those closed periods | "No blockers recorded in this period." |
| Key decisions | Closed period outcome summaries and tradeoff notes | "No decisions recorded in this period." |
| Priorities for next period | Monthly review improvement priorities for the period month (MBR) or last month of the quarter (QBR) | "No priorities recorded yet." |
| Team and threads line (inside Delivery) | Team members created in range, threads created in range | Line omitted when nothing changed, rather than padded |

The pure builder in `packages/domain/src/reports.ts` takes these gathered facts and emits ordered sections with `sourceKind` per section. Same input, same draft. The opening summary is a short factual paragraph built from counts (actions done, minutes focused, periods closed), never invented prose.

Range rules (analysis U2 and U3, decided here): every date range is inclusive at both ends. A planning period belongs to a report when its stored start to end overlaps the report range, even if it starts before the range. An action counts as completed in the period only when `completedAt` falls inside the range. Legacy done rows without `completedAt` are never dated by `updatedAt`; they are left out of the period's completed list and count, because guessing a completion month would break the exact figures promise in SC-004. For a running period, the display and export end date is today everywhere: panel, copy text and print use the same covers to today line (clarification G3).

**Rationale**: FR-012 and SC-004 demand figures that match the source screens. Reusing `planningPeriodGet` avoids a second capacity implementation drifting from 003.

**Alternatives considered**: Reading planning tables directly and recomputing load (rejected: duplicates 003 math). Iterating day by day over daily reviews (accepted in service as a bounded fallback only if a range read is awkward; preferred path is the new `listBetween` repository read in R8).

## R6. Refresh merge: edited wins

**Decision**: Every generated section starts `edited = false`. Any user change to a section body, the title or the summary sets its edited marker. Refresh regenerates all sections from current data, then keeps the stored body for every edited section and takes the fresh body for the rest. The result returns the list of section keys that changed, and the UI names them ("Updated: Delivery and capacity, Focus and workload"). A section the user deleted stays deleted on refresh unless it was never edited and is also absent, in which case it stays absent.

Removal and recovery (clarification C1): removing an edited section asks for confirmation first. Any removal offers Undo. Removal writes the tombstone row (`removed` 1, `edited` 1) instead of deleting data, and Undo clears the tombstone, restoring body, heading and sort order exactly.

**Rationale**: Clarification 4, word for word. Markers live on the section rows, so the rule survives restarts.

**Alternatives considered**: Whole draft replace with confirmation (rejected by clarification). Side by side pick per section (rejected by clarification as heavier than needed).

## R7. Themes: appearance and primary as two axes

**Decision**: Keep `data-theme` for appearance (`dark`, `light`) and add `data-accent` (`default`, `ember`, `signal`) on the same root element. `tokens.css` gains accent override blocks per appearance where contrast needs it. `theme.ts` grows `readAccent`, `writeAccent`, `applyAccent` beside the existing functions, with keys `los.ui.theme` (unchanged) and `los.ui.accent` (new, defaulting to `default`). Status hues are adjusted inside accent blocks so meaning survives: in Signal, `--danger` moves to a deeper maroon apart from the brighter primary red; in Ember, `--warning` moves toward yellow and `--status-conflicted` toward plum, while `StatusCue` text and icons remain the primary carrier everywhere. Required contrast pairs are listed in the contract and checked in verification: body text, muted text, primary button text on primary, danger text, warning text, each in all six combinations.

**Rationale**: Clarification 3. Two small axes reuse all 004 token work, and nobody loses light mode by picking a color. Both axes initialise in `apps/desktop/src/main.tsx` before `createRoot` renders, so the first paint already carries the pairing and no App effect flash occurs (analysis I2).

**Alternatives considered**: Four then six standalone themes (rejected by clarification, and would multiply `tokens.css`). Storing the pairing in SQLite settings (rejected: chrome preference, 004 precedent is `localStorage`).

## R8. Reads the reports feature needs

**Decision**: Extend repository ports minimally: daily reviews readable by date range, planning period metas listable by range and status, focus sessions listable by finished date range, report drafts by type and period. SQLite and memory implementations both land, behind the existing `WorkspaceRepos` shape. Actions, team members and threads already have list reads and are filtered in the service.

**Rationale**: Reports are the first cross cutting reader. Small range reads keep the builder honest and fast without new query machinery.

**Alternatives considered**: One report specific mega query in persistence (rejected: couples storage to report shape, breaks the memory and SQLite twin pattern).

## R9. Copy check and the step count baseline

**Decision**: `apps/desktop/scripts/check-copy.mjs` scans `apps/desktop/src`, `packages/domain/src` and `packages/app-services/src` for the em dash character, the en dash character, and a banned phrase list taken from User Story 4, printing `file:line` for every hit. An allowlist file beside it covers only verbatim outside quotes, each entry with a reason. Wired as `pnpm check:copy` at the root. It fails the implement verification until it prints zero.

For step counts (FR-021, SC-007), the baseline is measured before any UX change lands, using the quickstart scripts on the current build, and recorded in `checklists/verification-evidence.md`: one step is one click, keypress command or field commit that changes state. The same scripts run after, on the same five jobs.

The copy pass covers every user facing surface (clarification G2). Tasks enumerate the desktop files one by one, including the fortnight plan, planning history, calendar, database error screen, shell and navigation. The evidence file holds the inventory with each surface marked rewritten, reviewed with no change, or left out with a reason. A surface with no inventory line is treated as not done.

**Rationale**: FR-017 requires the check to exist and be recorded. Measuring the baseline first stops the team from quietly redefining steps later.

**Alternatives considered**: Husky or CI only check (rejected: repo has no hook runner today; a plain script is enough). Counting steps by feel (rejected: SC-007 is a measured claim).

## Resolved clarifications

All 12 clarify answers are mapped in plan.md, including the second round (section Undo, header watcher, full copy inventory, covers to today in exports, technique saved at session start, generic notification wording, count at timer end). Plan level decisions taken in this refresh: report ranges are inclusive with planning overlap, legacy actions need `completedAt` to count in a period, theme and accent initialise in `main.tsx` before first render, and SQLite plus memory repository work is sequential rather than parallel because both twins live in the same files. Deferred from clarify: whether the lead can delete or correct a mis recorded focus session. Decision taken here: sessions are history, so there is no edit UI in this feature. A session ended by mistake already counts nothing under 1 minute, and longer mistakes can be left as ended early. Revisit only if real use shows pain.
