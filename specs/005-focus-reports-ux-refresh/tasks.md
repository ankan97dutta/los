# Tasks: Focus, Reports and a Calmer LOS

**Input**: Design documents from `specs/005-focus-reports-ux-refresh/`

**Prerequisites**: plan.md (required, refreshed 2026-10-20 after analyze), spec.md (12 clarifications), research.md, data-model.md, contracts/focus-reports.md, quickstart.md

**Tests**: Included. The constitution test evidence gate and SC-001 to SC-010 require automated coverage for timer rules, the counted rule, report building, migration 5, refresh merge, section Undo, range membership and theme pairing, plus recorded manual evidence.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own. Setup and foundational work come first because every story depends on schema version 5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task in this list)
- **[Story]**: User story for story phase tasks only (US1 to US5)
- Every task names the file or files it touches

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline evidence and the one new dependency, before any behaviour changes

- [X] T001 Record the step count baseline for the five everyday jobs in quickstart.md Pass 3 on the current build, and create the evidence file with sections for SC-001 to SC-010 in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`
- [X] T002 Add `tauri-plugin-notification` version 2 to `[dependencies]` in `apps/desktop/src-tauri/Cargo.toml` and `@tauri-apps/plugin-notification` to `dependencies` in `apps/desktop/package.json`, then run `pnpm install` from the repo root
- [X] T003 Register the notification plugin with `.plugin(tauri_plugin_notification::init())` in the builder chain in `apps/desktop/src-tauri/src/lib.rs` and add `notification:default` to the permissions array in `apps/desktop/src-tauri/capabilities/default.json`

**Checkpoint**: Baseline recorded, plugin present but unused, app still builds and all existing suites pass (`pnpm test`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema version 5, storage wiring and shared settings fields that US1 and US2 both need

**CRITICAL**: No user story work begins until this phase is complete

- [X] T004 Create migration 5 in `packages/persistence/migrations/005_focus_reports.sql`: tables `focus_sessions`, `report_drafts`, `report_sections`, a unique constraint on `report_drafts` written as `UNIQUE (report_type, period_start)`, a unique constraint on `report_sections` written as `UNIQUE (draft_id, section_key)`, a `removed` integer column on `report_sections` with default 0, and seven focus preference columns on `workspace_settings` with the defaults from data-model.md (`focus_technique` default `pomodoro`, custom focus 25, custom break 5, long break 20, sound 1, notifications 1, include task name in notifications 0)
- [X] T005 Embed the same version 5 SQL as a `{ version: 5 }` entry in `MIGRATION_SCRIPTS` in `packages/persistence/src/migrations_embedded.ts` and raise `APP_MAX_SCHEMA_VERSION` from 4 to 5 in `packages/persistence/src/ports.ts`
- [X] T006 Extend `LosDbSnapshot` with `focusSessions`, `reportDrafts` and `reportSections` arrays and default them in `createEmptySnapshot` and `normalizeSnapshot` in `packages/persistence/src/memory_store.ts` so old preview JSON and old backups still load
- [X] T007 Add the focus preference fields to `WorkspaceSettings` as optional fields (`focusTechnique`, `focusCustomFocusMinutes`, `focusCustomBreakMinutes`, `focusLongBreakMinutes`, `focusSoundEnabled`, `focusNotificationsEnabled`, `focusNotificationsIncludeTask`) in `packages/domain/src/ports.ts`, and map the new columns in the SQLite settings read and write and in the memory settings read and write in `packages/persistence/src/sqlite_repos.ts` and `packages/persistence/src/repos.ts`
- [X] T008 Extend the repository port interfaces in `packages/domain/src/ports.ts`: `FocusRepository` (save, getById, listActive, listByFinishedDateRange), `ReportsRepository` (saveDraft with sections, getDraft by type and period start, listDrafts), `DailyRepository.listBetween(startDate, endDate)`, and `PlanningPeriodsRepository.listBetween(startDate, endDate)`. Document on the interfaces that all ranges are inclusive at both ends and that planning periods qualify by overlap with the range
- [X] T009 Implement the SQLite focus and reports repositories and the two new range reads in `packages/persistence/src/focus_repo.ts`, `packages/persistence/src/reports_repo.ts` and `packages/persistence/src/planning_repos.ts`, then wire them into `WorkspaceRepos` in `packages/persistence/src/sqlite_repos.ts`
- [X] T010 Implement the memory twins of T009 against the snapshot arrays in `packages/persistence/src/focus_repo.ts`, `packages/persistence/src/reports_repo.ts` and `packages/persistence/src/memory_planning.ts`, then wire them into `createRepos` in `packages/persistence/src/repos.ts`. This task is sequential after T009, not parallel, because both touch the same repository files
- [X] T011 Extend the settings patch type in `settingsUpdate` to accept the seven focus preference fields in `packages/app-services/src/workspace.ts` and add the matching partial fields to the settings wrapper in `apps/desktop/src/lib/api.ts`
- [X] T012 Add the migration and storage tests: version 5 applies cleanly on a version 4 database and on an empty database, a schema 5 backup restores with focus and report rows intact, and a schema 6 database is still refused, in `packages/persistence/tests/migrations.test.ts` and `packages/persistence/tests/backup_restore.test.ts`

**Checkpoint**: Fresh and upgraded databases reach schema 5, preview mode boots, `pnpm test` green, no UI change yet

---

## Phase 3: User Story 1 - Work on one thing with a focus timer (Priority: P1) MVP

**Goal**: A lead starts a Pomodoro, Deep work or Custom session from an action, a planning item or a typed intention, sees it in an overlay, gets told in words when a block or break ends (generic system notification in the background, task name only if turned on), and sees today's blocks and minutes counted from the moment each timer ends.

**Independent Test**: Quickstart Pass 1 and Pass 6 step 1, with network off: start from Personal Actions, pause and resume, finish a short Custom block, take the break, end the next block early, leave the overlay and watch the header timer fire the alert, close and reopen mid block in Tauri.

### Tests for User Story 1

- [X] T013 [P] [US1] Domain timer tests in `packages/domain/tests/focus.test.ts`: technique catalogue values (Pomodoro focus 25 break 5, Deep work focus 50 break 10, long break offered after 4 blocks), custom minutes rejected outside "whole numbers, 5 to 180" and long break outside "15 to 30", pause and resume keep remaining seconds, counted seconds never exceed `plannedFocusMinutes * 60`, ending early under 60 counted seconds counts zero
- [X] T014 [P] [US1] Counted rule and service tests in `packages/app-services/tests/focus.test.ts`: `finishedLocalDate` and capped counted seconds are fixed at the focus deadline and unchanged after break, next block and close; day summary counts a session in `focusDone`, `breakRunning`, `breakDone` or `finished` and never `endedEarly`; second start while active fails with the active session returned; reconcile turns an expired running session into `focusDone` and an expired break into `breakDone`; `focusStart` saves the used technique and Custom lengths as last used preferences; marking a linked action done happens only through `focusClose` with `markTaskDone`
- [X] T015 [P] [US1] Persistence tests in `packages/persistence/tests/focus_repo.test.ts`: session round trip through SQLite and memory repos, `listActive` returns at most the active set, `listByFinishedDateRange` includes both boundary dates
- [X] T016 [P] [US1] Desktop view helper and watcher tests in `apps/desktop/src/features/focus/focusView.test.ts`: `mm:ss` formatting never shows negative time, block wording reads "Block 2 of 4", phase words for running, paused, break and done states, and the watcher fires end handling exactly once per session id and phase across overlay close and reopen

### Implementation for User Story 1

- [X] T017 [US1] Implement techniques, session transitions, reconcile math and the day summary in `packages/domain/src/focus.ts` following the state machine and counted rule in data-model.md, with `taskLabel` validated as "1 to 200 characters" for intentions and the label snapshotted at start for linked tasks, and export it from `packages/domain/src/index.ts`
- [X] T018 [US1] Implement `focusStart`, `focusGetActive`, `focusPause`, `focusResume`, `focusEndEarly`, `focusStartBreak`, `focusStartNextBlock`, `focusClose`, `focusTodaySummary` and `focusReconcile` with the contract signatures in `packages/app-services/src/focus.ts`, enforcing one active session before every start and writing the used technique and Custom lengths to focus preferences on a successful start, and export from `packages/app-services/src/index.ts`
- [X] T019 [US1] Add the `api.focusStart` and sibling wrappers mirroring the service names in `apps/desktop/src/lib/api.ts`
- [X] T020 [US1] Implement the notification wrapper `notifyFocusEnded({ phase, taskLabel, includeTask })` returning `sent`, `denied`, `unavailable`, `off` or `preview` and never throwing, with lazy permission request and the `isTauriRuntime` guard, sending phase only wording ("Focus block done", "Break done") unless `includeTask` is true, in `apps/desktop/src/lib/focusNotify.ts`
- [X] T021 [US1] Build the overlay component in `apps/desktop/src/features/focus/FocusOverlay.tsx`: dialog over a dimmed inert page, task or intention field, technique picker (Pomodoro, Deep work, Custom with minute inputs) preselecting the last used technique and lengths, time left, block and phase wording, Pause or Resume, End session, Leave, `aria-live` phase announcements, WebAudio end tone honoring the sound setting, and the Start break, Start next block and Close session choices after a phase ends, with nothing auto starting
- [X] T022 [US1] Add overlay, dimmed backdrop, running chip and live region styles in `apps/desktop/src/styles/base.css`, keeping the focus ring token driven and the Leave control always visible at 1024 by 680
- [X] T023 [US1] Mount the overlay in `apps/desktop/src/App.tsx` beside the palette and tour, run `focusReconcile` once after boot, show the running session chip in the shell header through `apps/desktop/src/shell/AppShell.tsx` (technique, remaining time, state word, reopens the overlay), and add the `Start focus session` action under a new Focus group plus intention start handling in `apps/desktop/src/shell/CommandPalette.tsx`
- [X] T024 [US1] Add the App level session watcher in `apps/desktop/src/App.tsx`: a one second interval while any session is active that reconciles, updates the header chip countdown, and fires end handling exactly once per session and phase when the overlay is closed or the document is hidden (in-app wording state and `notifyFocusEnded` with the include task preference), with fired markers kept outside the overlay so closing it cannot refire or lose an alert
- [X] T025 [P] [US1] Add a Focus button per open action row in `apps/desktop/src/features/actions/ActionsPage.tsx` that opens the overlay with `taskKind` `action` preselected
- [X] T026 [P] [US1] Add a Focus action per candidate work item in `apps/desktop/src/features/planning/CapacityPlanPage.tsx` that opens the overlay with `taskKind` `workItem` preselected, without changing any capacity rule or field
- [X] T027 [P] [US1] On Today, add the focus entry point and the line "Focus today: N blocks, M minutes" from `focusTodaySummary`, or worded empty copy when there are none, in `apps/desktop/src/features/reviews/DailyReviewPage.tsx`
- [X] T028 [US1] In Settings, add the Focus group with technique defaults display, custom focus and break minute inputs, long break minutes, sound checkbox, notifications checkbox and the include task name in notifications checkbox (off by default, with plain wording that notifications can appear on a lock screen), all saving through the extended settings patch, showing "Notifications: n/a (browser preview)" in preview and "System notifications are unavailable. In-app alerts still work." when Tauri reports denial, in `apps/desktop/src/features/settings/SettingsPage.tsx`
- [ ] T029 [US1] Run quickstart Pass 1 and the focus parts of Pass 6, fix failures, and record SC-001, SC-002 and SC-003 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`

**Checkpoint**: User Story 1 works end to end on its own in preview and Tauri. This is the MVP.

---

## Phase 4: User Story 2 - Turn a month or a quarter into a report worth sending (Priority: P1)

**Goal**: From Reviews, the lead generates an MBR or QBR draft built only from local data for the period, edits it, removes a section with confirmation and Undo, refreshes without losing edits, and copies or prints it with honest running period wording.

**Independent Test**: Quickstart Pass 2: seed the listed test data, generate this month's MBR, verify every figure against its source screen, edit, remove and undo a section, refresh after a data change, copy, print, then repeat for the quarter.

### Tests for User Story 2

- [X] T030 [P] [US2] Domain report tests in `packages/domain/tests/reports.test.ts`: month bounds run first to last day, quarter bounds run first day of the first month to last day of the third month, running period is flagged not complete, future periods are never produced, empty facts produce the honest empty sentences from research R5 and no zero figures
- [X] T031 [P] [US2] Refresh merge and removal tests in the same `packages/domain/tests/reports.test.ts`: edited sections keep their body word for word, unedited sections take the fresh body, lead added sections survive, a tombstone row (`removed` 1, `edited` 1) stays removed through refresh and Undo (clearing `removed`) restores body, heading and sort order, and `updatedSectionKeys` names exactly the sections that changed
- [X] T032 [P] [US2] Service tests in `packages/app-services/tests/reports.test.ts`: generation for a seeded month returns figures matching `planningPeriodGet` totals for a closed period that overlaps the month even when it starts before it; an action counts only when `completedAt` falls inside the period and a done action without `completedAt` is left out even when `updatedAt` is inside; `reportGenerate` returns the existing draft untouched on a second call; copy text for a running period ends its period line at today and contains title, summary and every section in order
- [X] T033 [P] [US2] Persistence tests in `packages/persistence/tests/reports_repo.test.ts`: draft plus sections round trip in SQLite and memory, uniqueness on (`report_type`, `period_start`) and (`draft_id`, `section_key`) holds, edited and removed markers survive save and reload

### Implementation for User Story 2

- [X] T034 [US2] Implement period math (`mbr` first to last day of one month, `qbr` first day of the quarter's first month to last day of its third month), the pure `buildReportDraft(facts, period)` builder with fixed section order and `sourceKind` per section, and the refresh merge in `packages/domain/src/reports.ts`, exported from `packages/domain/src/index.ts`
- [X] T035 [US2] Implement fact gathering and `reportPeriods`, `reportGenerate`, `reportGet`, `reportSaveEdits` (including remove and Undo as tombstone writes), `reportRefresh` and `reportCopyText` in `packages/app-services/src/reports.ts`, reading monthly reviews, daily reviews by range, actions by `completedAt`, closed planning periods by overlap through the existing planning services, team members, threads and focus sessions by finished date, with copy text using today as the end date for a running period, and export from `packages/app-services/src/index.ts`
- [X] T036 [US2] Add the `api.reportPeriods` and sibling wrappers in `apps/desktop/src/lib/api.ts`
- [X] T037 [US2] Add the `reviews-reports` route id to `RouteId` and `ReviewsSection`, keeping the Reviews default child on Calendar, in `apps/desktop/src/shell/routes.ts`
- [X] T038 [US2] Add the fourth tab labelled Reports to the Reviews sub navigation and render the panel for `reviews-reports` in `apps/desktop/src/features/reviews/ReviewsPage.tsx`, and add the `Go to Reports` palette action in `apps/desktop/src/shell/CommandPalette.tsx`
- [X] T039 [US2] Build the reports panel in `apps/desktop/src/features/reviews/ReportsPanel.tsx`: type segmented control (Monthly MBR, Quarterly QBR), period select with no future periods, generate and draft states, the "Covers 1 Sep to today" line for running periods, editable title, summary and sections with saved wording, add section, remove section with confirmation when the section is edited and an Undo action after any removal restoring text, heading and place, Refresh with the updated sections status line, Copy, and Print calling `window.print` on the report article only
- [X] T040 [US2] Add report panel and `@media print` styles (hide shell and controls, light background, dark text, 11 to 12 pt body, covers to today line included) in `apps/desktop/src/styles/base.css`
- [ ] T041 [US2] Run quickstart Pass 2, fix failures, and record SC-004 and SC-005 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`

**Checkpoint**: User Stories 1 and 2 both work independently. Reports appear in focus figures only after US1 data exists, and say so honestly before that.

---

## Phase 5: User Story 3 - Less tapping around, more signal on every screen (Priority: P2)

**Goal**: Each primary screen leads with its main answer, repeated choices are remembered, shared save and state patterns hold everywhere, and the five everyday jobs take no more steps than the T001 baseline.

**Independent Test**: Quickstart Pass 3 in full, keyboard only, at 1024 by 680.

- [X] T042 [US3] Today insight first: move the day's focus line, open blockers and next actions above the long form fields behind a labelled disclosure, keeping blocking wording visible, in `apps/desktop/src/features/reviews/DailyReviewPage.tsx`
- [X] T043 [P] [US3] Inbox insight first: open count and the single next action lead the page, kept items move behind a labelled disclosure, in `apps/desktop/src/features/inbox/InboxPage.tsx`
- [X] T044 [P] [US3] Planning insight first: period identity, status, load versus remaining and warnings lead, member detail collapses below, conflict banner never collapses, in `apps/desktop/src/features/planning/CapacityPlanPage.tsx`
- [X] T045 [P] [US3] Reviews insight first: calendar leads with the current period state, Reports and history keep their lead lines, in `apps/desktop/src/features/reviews/ReviewsPage.tsx` and `apps/desktop/src/features/reviews/ReviewsCalendar.tsx`
- [X] T046 [P] [US3] Team and Settings tidy up: roster count and thread count lead Team, preference groups keep one clear order in Settings, in `apps/desktop/src/features/team/TeamPage.tsx` and `apps/desktop/src/features/settings/SettingsPage.tsx`
- [X] T047 [US3] Confirm the shared patterns are the only ones used: `SaveIndicator`, `Banner`, `EmptyState` and `StatusCue` from `apps/desktop/src/ui/` on every edited surface, replacing any one off save or error wording found during T042 to T046, with edits in the same page files
- [X] T048 [US3] Remember repeated choices: focus technique and lengths persist from US1 at session start, report type and period persist in `localStorage` keys `los.reports.lastType` and `los.reports.lastPeriod` read and written in `apps/desktop/src/features/reviews/ReportsPanel.tsx`, theme pairing persists under US5
- [X] T049 [US3] Keyboard pass over QuickCapture, navigation, the focus overlay, Reports actions and the theme selects: visible focus everywhere, Escape backs out, no hover or drag only path, fixing issues in `apps/desktop/src/App.tsx` and the pages touched in this phase
- [X] T050 [US3] Re-run the five everyday jobs, compare with the T001 baseline in the evidence file (no job up, at least 3 down), and record SC-007 and SC-008 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`

**Checkpoint**: Same product, fewer steps, first view answers the main question on every primary screen

---

## Phase 6: User Story 4 - Words that sound like a person wrote them (Priority: P2)

**Goal**: Every user facing surface is reviewed, reads plainly, and contains zero em dash and zero en dash characters and no banned stock phrases, guarded by an automated check and a recorded inventory.

**Independent Test**: Quickstart Pass 4: `pnpm check:copy` prints no hits, the copy inventory has a line for every surface, then the read aloud pass.

- [X] T051 [US4] Implement the copy scan in `apps/desktop/scripts/check-copy.mjs`: scan `apps/desktop/src`, `packages/domain/src` and `packages/app-services/src` for the em dash character, the en dash character and the banned phrase list from contracts/focus-reports.md, print `file:line` hits and exit nonzero on any, reading `apps/desktop/scripts/check-copy.allowlist.json` for verbatim quote exceptions with a reason per entry, and add the root script `"check:copy": "node apps/desktop/scripts/check-copy.mjs"` in `package.json`
- [X] T052 [US4] Create the copy inventory in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md` listing every file under `apps/desktop/src` that renders user facing text, each marked rewritten, reviewed with no change, or left out with a reason, covering all files named in T053 to T056 plus `apps/desktop/src/features/reviews/FortnightPlanPage.tsx`, `apps/desktop/src/features/reviews/PlanningHistoryPanel.tsx`, `apps/desktop/src/features/reviews/ReviewsCalendar.tsx`, `apps/desktop/src/features/status/DbOpenError.tsx`, `apps/desktop/src/shell/AppShell.tsx` and `apps/desktop/src/shell/Nav.tsx`
- [X] T053 [US4] Rewrite Today, Inbox, Actions and fortnight copy in place: titles, ledes, buttons, empty states and errors in `apps/desktop/src/features/reviews/DailyReviewPage.tsx`, `apps/desktop/src/features/reviews/FortnightPlanPage.tsx`, `apps/desktop/src/features/inbox/InboxPage.tsx`, `apps/desktop/src/features/inbox/QuickCapture.tsx` and `apps/desktop/src/features/actions/ActionsPage.tsx`, updating the T052 inventory lines for each
- [X] T054 [P] [US4] Rewrite Planning and Team copy in place in `apps/desktop/src/features/planning/CapacityPlanPage.tsx`, `apps/desktop/src/features/team/TeamPage.tsx`, `apps/desktop/src/features/team/TeamRosterPanel.tsx` and `apps/desktop/src/features/applications/ApplicationsPage.tsx`, updating the T052 inventory lines for each
- [X] T055 [P] [US4] Rewrite Reviews, history, Reports, Focus and Settings copy in place in `apps/desktop/src/features/reviews/ReviewsPage.tsx`, `apps/desktop/src/features/reviews/MonthlyReviewPage.tsx`, `apps/desktop/src/features/reviews/PlanningHistoryPanel.tsx`, `apps/desktop/src/features/reviews/ReviewsCalendar.tsx`, `apps/desktop/src/features/reviews/ReportsPanel.tsx`, `apps/desktop/src/features/focus/FocusOverlay.tsx` and `apps/desktop/src/features/settings/SettingsPage.tsx`, including report section headings and empty sentences in `packages/domain/src/reports.ts`, updating the T052 inventory lines for each
- [X] T056 [P] [US4] Rewrite shell and status copy in place: route titles and contexts in `apps/desktop/src/shell/routes.ts`, palette labels in `apps/desktop/src/shell/CommandPalette.tsx`, brand and header wording in `apps/desktop/src/shell/AppShell.tsx` and `apps/desktop/src/shell/Nav.tsx`, tour steps in `apps/desktop/src/shell/Tour.tsx`, shortcut help in `apps/desktop/src/shell/ShortcutsDialog.tsx`, section sub navigation labels in `apps/desktop/src/shell/SectionSubNav.tsx`, database error wording in `apps/desktop/src/features/status/DbOpenError.tsx` and status wording in `apps/desktop/src/features/status/LocalStatus.tsx`, keeping the FR-U14 canonical tray and shortcut phrases from 004 word for word, updating the T052 inventory lines for each
- [X] T057 [US4] Sweep date and number ranges so every formatted range uses "to" (for example "1 Sep to 30 Sep 2026") in the formatting helpers in `apps/desktop/src/features/reviews/ReviewsCalendar.tsx`, `apps/desktop/src/features/planning/planningView.ts` and `packages/domain/src/periods/calendar.ts`, only where the rendered text reaches the screen
- [X] T058 [US4] Fix empty states and errors found by reading: every empty state names what belongs there plus one next step, every error says what happened, what it means and what to do next, unknown values read as unknown, applying edits in the page files from T053 to T056
- [X] T059 [US4] Re-run `pnpm check:copy` to zero hits, confirm the T052 inventory has no unmarked surface, do the read aloud pass from quickstart Pass 4, and record SC-006 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`

**Checkpoint**: The app speaks plainly everywhere, and the check plus inventory keep it that way

---

## Phase 7: User Story 5 - Two more themes, orange and red (Priority: P3)

**Goal**: Appearance (Dark or Light) and Primary color (Default, Ember orange, Signal red) are separate remembered choices that hold up on every screen, with status meaning carried by words and icons in all six pairings.

**Independent Test**: Quickstart Pass 5 across all six pairings, with an error in Signal red and a conflicted plan in Ember orange.

- [X] T060 [P] [US5] Extend theme state in `apps/desktop/src/ui/theme.ts`: `UiAccent` type (`default`, `ember`, `signal`), `readAccent`, `writeAccent`, `applyAccent` and `initAccent` using the `los.ui.accent` key, keeping `los.ui.theme` behaviour unchanged for existing users
- [X] T061 [US5] Call `initTheme` and `initAccent` in `apps/desktop/src/main.tsx` before `createRoot` renders, and remove the later `initTheme` effect call from `apps/desktop/src/App.tsx` so the first paint already carries the saved appearance and pairing with no flash
- [X] T062 [US5] Add accent token blocks in `apps/desktop/src/styles/tokens.css`: `[data-accent='ember']` and `[data-accent='signal']` under both appearances, changing only `--accent`, `--accent-strong`, `--accent-dim`, `--on-accent` and `--focus-ring`, plus the status separation the contract requires (deeper maroon `--danger` and `--status-danger` in Signal, yellower `--warning` and plum `--status-conflicted` in Ember)
- [X] T063 [US5] Split the Settings theme control into two selects, Appearance (Dark graphite, Light) and Primary color (Default, Ember orange, Signal red), each applying instantly and independently with its own saved message, in `apps/desktop/src/features/settings/SettingsPage.tsx`
- [X] T064 [US5] Add the desktop test for theme pairing in `apps/desktop/src/ui/theme.test.ts`: defaults are dark plus default, writing an accent never changes appearance and the reverse, and stored values round trip through the readers
- [X] T065 [US5] Check printed reports ignore the pairing (print stays light from T040) and the focus overlay, dialogs and palette follow the pairing, fixing token use in `apps/desktop/src/styles/base.css` where a hard coded accent is found
- [X] T066 [US5] Run quickstart Pass 5, record the six contrast spot checks with hex pairs (body, muted, primary button text, danger, warning, conflicted) and SC-009 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`

**Checkpoint**: All five stories are independently functional

---

## Phase 8: Polish and Cross-Cutting Concerns

**Purpose**: Prove the guardrails, close the evidence, and leave the tree clean

- [X] T067 Run the full suite from the repo root (`pnpm test`, `pnpm -r build`, `pnpm check:copy`) and fix any regression in 001 to 004 suites, recording the run in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`
- [ ] T068 Run quickstart Pass 6: network off focus and report flows, Tauri backup then reset then restore bringing back focus history and report drafts, recording SC-010 results in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`
- [ ] T069 Verify narrow window and keyboard only behaviour of the overlay and Reports at 1024 by 680 in Tauri, and confirm no primary control needs hover, fixing issues in `apps/desktop/src/styles/base.css`
- [X] T070 Confirm the LocalStatus phrases from 004 (FR-U14) still render word for word after the copy pass, and the notification wording from T028 sits beside them without duplication, checking `apps/desktop/src/features/status/LocalStatus.tsx` and `apps/desktop/src/features/settings/SettingsPage.tsx`
- [X] T071 Finish the evidence file so SC-001 to SC-010 each have a result, a date and a build or test reference, and the copy inventory from T052 has no unmarked surface, in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md`
- [X] T072 Final tidy: no dead code or unused exports left from this feature across `packages/domain/src/focus.ts`, `packages/domain/src/reports.ts`, `apps/desktop/src/features/focus/` and `apps/desktop/src/features/reviews/ReportsPanel.tsx`, and update the feature status line in `specs/005-focus-reports-ux-refresh/spec.md` to ready for review

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts now. T001 must land before any US3 change, or the baseline is meaningless
- **Foundational (Phase 2)**: Depends on Setup. Blocks every story (schema and settings shape). T010 runs sequentially after T009 because both touch the same repository files
- **US1 (Phase 3)**: Depends on Phase 2. The MVP
- **US2 (Phase 4)**: Depends on Phase 2. Uses US1 focus data when present but is testable without it (honest empty focus section), so it may run in parallel with US1 once Phase 2 lands
- **US3 (Phase 5)**: Depends on US1 and US2 surfaces existing (it reorders them). Soft depends on both
- **US4 (Phase 6)**: Copy rewrites touch files from US1 and US2, so it runs after them. The scan (T051) and inventory (T052) may be built any time after Phase 2
- **US5 (Phase 7)**: Independent of US1 and US2 behaviour. Runs any time after Phase 2, but its contrast check reads best after US4 wording settles
- **Polish (Phase 8)**: Depends on all stories the release includes

### User Story Dependencies

- **US1 (P1)**: No story dependency. Deliver and validate alone as the MVP
- **US2 (P1)**: No hard story dependency. Focus section is richer after US1, honest and empty before it
- **US3 (P2)**: Depends on US1 and US2 surfaces to reorder. Does not change their behaviour
- **US4 (P2)**: Depends on US1 and US2 files existing. Independent of US3 ordering, but do US3 first to avoid rewriting copy that is about to move
- **US5 (P3)**: Independent. Any story's screens pick the pairing up through tokens automatically

### Within Each User Story

- Tests first, watched failing, then domain, then services, then storage use, then UI, then the quickstart pass for that story
- Domain before services, services before desktop wrappers, wrappers before components

## Parallel Opportunities

- Phase 1: T002 and T003 touch different trees and can run together once T001 is recorded
- Phase 2: no parallel pair inside the repository work (T009 then T010 sequential, same files). T012 tests can start once T005 lands
- US1: all four test tasks (T013 to T016) in parallel; T025, T026 and T027 in parallel after T023 and T024 fix the overlay and watcher contracts
- US2: all four test tasks (T030 to T033) in parallel; T037 and T038 in parallel
- US3: T043, T044, T045 and T046 in parallel
- US4: T054, T055 and T056 in parallel after T051 prints the hit list and T052 opens the inventory
- US5: T060 and T062 in parallel

## Parallel Example: User Story 1 tests

```bash
# Launch all US1 test tasks together, watch them fail, then implement:
Task: "Domain timer tests in packages/domain/tests/focus.test.ts"
Task: "Counted rule and service tests in packages/app-services/tests/focus.test.ts"
Task: "Persistence tests in packages/persistence/tests/focus_repo.test.ts"
Task: "Desktop view helper and watcher tests in apps/desktop/src/features/focus/focusView.test.ts"
```

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 and Phase 2 in full
2. Phase 3 (US1), then stop and validate with quickstart Pass 1
3. Demo: Pomodoro from an action, overlay, header timer, break, today totals, generic background notification in Tauri

### Incremental delivery

1. Setup and Foundational: schema 5 ready, nothing user visible
2. US1: focus mode ships
3. US2: MBR and QBR ship inside Reviews, with section Undo
4. US3, then US4: calmer screens, then the inventoried copy pass over every surface
5. US5: Ember and Signal pairings, applied from first paint
6. Polish: guardrails, evidence, release

### Parallel team strategy

1. One person does Phase 1 and Phase 2
2. Then split: developer A on US1, developer B on US2, developer C on US5
3. US3 and US4 follow on the merged surfaces, in that order

## Notes

- [P] means different files and no unfinished dependency. Same file tasks are never marked [P] together, and T009 to T010 are sequential on purpose
- Copy discipline applies to this feature's own code comments and strings: no em dash or en dash characters, ranges with "to"
- The FR-U14 phrases in LocalStatus from 004 are canonical. T056 and T070 protect them on purpose
- Commit after each task or small group, and stop at every checkpoint to validate before moving on

## Phase 9: Convergence

- [ ] T073 Add a Focus entry point on the Inbox page itself (not only on Personal Actions under the same section), opening the overlay in no more than 2 actions per FR-001 and US1/AC1 (partial)
- [X] T074 Show the technique name alongside the phase word and live countdown on the header focus chip in `apps/desktop/src/App.tsx` per FR-005 (partial)
- [X] T075 Make the page behind the focus overlay truly non-interactive for keyboard users (focus trap or inert background, focus returned to the opener on close) in `apps/desktop/src/features/focus/FocusOverlay.tsx` and `apps/desktop/src/App.tsx` per FR-005 and FR-023 (partial)
- [ ] T076 Send the system notification only when the app is in the background or the document is hidden, keep the result of `notifyFocusEnded`, and surface the denied or unavailable state in words in Settings ("System notifications are unavailable. In-app alerts still work.") in `apps/desktop/src/App.tsx` and `apps/desktop/src/features/settings/SettingsPage.tsx` per FR-006 (partial)
- [X] T077 After ending a session early, offer the same closing choices as after a finished block (mark the linked action done, keep it open, or leave it as it was), and give a break in progress an end or close control, in `apps/desktop/src/features/focus/FocusOverlay.tsx` per US1/AC6 and FR-005 (partial)
- [X] T078 Label the long break as a long break with its length when it is due after 4 blocks, in `apps/desktop/src/features/focus/FocusOverlay.tsx` per FR-004 (partial)
- [ ] T079 Replace the static "Saved on this device." line in Reports with the shared save pattern (saving, saved, save failed in words at the point of edit, using `SaveIndicator`) in `apps/desktop/src/features/reviews/ReportsPanel.tsx` per FR-024 and US3/AC6 (partial)
- [ ] T080 Fix report print and covers wording: mark the Reports controls as non-printing so the period select, inputs and page lead do not print, and show the running-period line with formatted dates ("Covers 1 Sep to today") instead of the raw ISO date, in `apps/desktop/src/features/reviews/ReportsPanel.tsx` and `apps/desktop/src/styles/base.css` per FR-015 (partial)
- [ ] T081 Make report focus figures follow the counted rule exactly (reuse the domain counted test so ended-early minutes never add focused minutes) and include carried-over actions in the gathered facts, in `packages/app-services/src/reports.ts` and `packages/domain/src/reports.ts` per FR-008 and FR-012 (partial)
- [ ] T082 Use the recomputed period completeness (not the stored draft flag) when building copy text, so a report copied after its period ends no longer says it covers to today, in `packages/domain/src/reports.ts` per FR-015 (partial)
- [ ] T083 Add the missing migration safety tests: a version 4 database upgrades cleanly to version 5, and a schema 5 backup restores with focus session and report draft rows intact, in `packages/persistence/tests/` per Constitution VII, the migration safety gate, and T012 (partial)
- [ ] T084 Re-measure and honestly record the five everyday job step counts so SC-007 holds (no job up, at least 3 of the 5 down), cutting steps in the flows that still match their baseline (capture, past closed period, theme change) or recording the real counts and the shortfall in `specs/005-focus-reports-ux-refresh/checklists/verification-evidence.md` per FR-021 and SC-007 (partial)
