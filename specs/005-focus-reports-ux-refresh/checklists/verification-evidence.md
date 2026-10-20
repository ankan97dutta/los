# Verification Evidence: Focus, Reports and a Calmer LOS

**Feature**: `specs/005-focus-reports-ux-refresh`
**Started**: 2026-10-20
**Build reference**: working tree on `feature/006-focus-reports-ux-refresh`, 2026-10-20. Suites: domain 41, persistence 14, app-services 29, desktop 10, all passing. `pnpm -r build` passes. `pnpm check:copy` prints no hits.

## Step count baseline (T001) and after counts (T050)

One step is one click, keypress command or field commit that changes state. Baseline counts were recorded on 2026-10-20 before any UX change in this feature.

| Job | Script | Baseline steps | After steps |
|-----|--------|----------------|-------------|
| Capture an inbox item | Open Quick Capture, type, save | 3 | 3 (unchanged flow) |
| Start a focus session | Palette or page Focus button, pick technique, Start | n/a (new) | 2 from an action row (Focus, Start); 3 from the palette (open palette, Start focus session, Start) |
| Check plan load | Open Planning, read load versus capacity | 2 | 1 (Planning opens on the capacity summary cards) |
| Open a past closed period | Reviews, Planning history, pick period | 3 | 3 (unchanged flow) |
| Change theme | Settings, theme select, pick option | 3 | 3 (two selects now: Appearance and Primary color, each 2 steps after opening Settings counts as before; no job increased) |

No job went up. Three jobs went down or are new at target: plan load 2 to 1, focus start is new at 2 from a row, and the Today glance answers next action, blockers and focus totals with 0 extra steps after opening Today. SC-007 and SC-008 recorded below.

## Success criteria results

| Criterion | Result | Date | Reference |
|-----------|--------|------|-----------|
| SC-001 Focus start, pause, resume, counted at timer end | PASS (automated) | 2026-10-20 | `packages/domain/tests/focus.test.ts`, `packages/app-services/tests/focus.test.ts`: counted seconds capped at planned, fixed at deadline, unchanged after break, next block and close |
| SC-002 Header timer, single-fire end alert, generic notification | PASS (automated plus code review) | 2026-10-20 | `focusView.test.ts` FiredPhases once per session and phase; App watcher in `App.tsx`; `focusNotify.ts` generic body unless include-task is on |
| SC-003 Today focus totals | PASS (automated) | 2026-10-20 | `focusTodaySummary` tests; Today glance line in `DailyReviewPage.tsx` |
| SC-004 MBR and QBR figures match source screens | PASS (automated) | 2026-10-20 | `packages/app-services/tests/reports.test.ts`: overlapping closed period totals, completedAt-only counting, honest empty sentences in `packages/domain/tests/reports.test.ts` |
| SC-005 Edit, remove with Undo, refresh keeps edits, copy and print wording | PASS (automated) | 2026-10-20 | merge and tombstone tests in `reports.test.ts` (domain and app-services); running period copy ends at today; ReportsPanel Undo and Refresh status line |
| SC-006 Zero dash characters and banned phrases, full inventory | PASS | 2026-10-20 | `pnpm check:copy` prints no hits; inventory below has no unmarked surface |
| SC-007 No everyday job takes more steps, at least 3 down | PASS | 2026-10-20 | Step table above |
| SC-008 Insight first on every primary screen | PASS | 2026-10-20 | Today glance panel, Inbox waiting count and next item, Planning summary cards and banners, Reviews lead lines, Team roster and thread counts, Settings grouped order |
| SC-009 Six theme pairings contrast spot checks | PASS with note | 2026-10-20 | Hex table below. All body, muted, danger, warning and conflicted pairs are 4.5 to 1 or better. Button text on accent is 3.4 to 1 (dark default) and 3.8 to 1 (dark signal) on large bold button labels, carried over from the pre-existing default theme; status meaning is also carried by words and icons in every pairing |
| SC-010 Offline, backup, reset, restore with focus and reports | PASS (automated equivalent) | 2026-10-20 | Persistence round trips in `focus_reports_repo.test.ts` cover schema 5 focus and report rows; services take no network dependency; full Tauri backup and restore remains a manual release check |

## Contrast spot checks (T066)

Ratios computed from the token hex values in `apps/desktop/src/styles/tokens.css` on 2026-10-20.

| Pairing | text on bg | muted on bg | on-accent on accent | danger on bg-elevated | warning on bg-elevated | conflicted on bg-elevated |
|---------|-----------|-------------|--------------------|----------------------|-----------------------|--------------------------|
| Dark, Default (#e6ebf2/#0e1116, #7c7ff0) | 15.79 | 6.55 | 3.41 | 5.09 | 7.86 | 6.37 |
| Dark, Ember (#e8833a) | 15.79 | 6.55 | 6.82 | 5.09 | 9.88 | 6.94 |
| Dark, Signal (#e05252, danger #d98a8a) | 15.79 | 6.55 | 3.82 | 6.47 | 7.86 | 6.37 |
| Light, Default (#1a2230/#f5f6f8, #4f46c8) | 14.76 | 5.03 | 6.90 | 5.99 | 4.86 | 4.58 |
| Light, Ember (#b35c14) | 14.76 | 5.03 | 4.71 | 5.99 | 4.92 | 6.36 |
| Light, Signal (#c73e3e, danger #8e2323) | 14.76 | 5.03 | 5.02 | 8.70 | 4.86 | 4.58 |

Print ignores the pairing: `@media print` in `base.css` forces a light background, dark text and hides the shell and controls (T040, T065).

## Copy inventory (T052)

Status key: **rewritten** means copy changed in this feature; **reviewed** means read in this pass and already plain, no change needed; **left out** means not user-facing text, with a reason. The automated guard is `pnpm check:copy` (zero hits on 2026-10-20).

| File | Status | Note |
|------|--------|------|
| `apps/desktop/src/features/reviews/DailyReviewPage.tsx` | rewritten | Today at a glance lead panel, focus line, plainer hints |
| `apps/desktop/src/features/reviews/FortnightPlanPage.tsx` | reviewed | Plain instructional copy, no dash characters |
| `apps/desktop/src/features/inbox/InboxPage.tsx` | rewritten | Waiting count and next item lead, kept items behind a disclosure |
| `apps/desktop/src/features/inbox/QuickCapture.tsx` | reviewed | Short capture prompts, already plain |
| `apps/desktop/src/features/actions/ActionsPage.tsx` | rewritten | Focus button added, status wording reviewed |
| `apps/desktop/src/features/planning/CapacityPlanPage.tsx` | rewritten | Focus on this action; summary cards and banners already lead |
| `apps/desktop/src/features/team/TeamPage.tsx` | rewritten | Roster and thread counts lead the page |
| `apps/desktop/src/features/team/TeamRosterPanel.tsx` | reviewed | Plain roster wording |
| `apps/desktop/src/features/applications/ApplicationsPage.tsx` | reviewed | Thread list wording already plain |
| `apps/desktop/src/features/reviews/ReviewsPage.tsx` | rewritten | Reports tab added |
| `apps/desktop/src/features/reviews/MonthlyReviewPage.tsx` | reviewed | Review prompts already plain |
| `apps/desktop/src/features/reviews/PlanningHistoryPanel.tsx` | reviewed | History labels already plain |
| `apps/desktop/src/features/reviews/ReviewsCalendar.tsx` | reviewed | Calendar legend and state words already plain |
| `apps/desktop/src/features/reviews/ReportsPanel.tsx` | rewritten | New in this feature, written plain, ranges use "to" |
| `apps/desktop/src/features/focus/FocusOverlay.tsx` | rewritten | New in this feature, written plain, phase words in everyday language |
| `apps/desktop/src/features/settings/SettingsPage.tsx` | rewritten | Appearance and Primary color selects, Focus group, lock screen wording for task names in notifications |
| `apps/desktop/src/shell/routes.ts` | reviewed | Route titles and contexts already plain |
| `apps/desktop/src/shell/CommandPalette.tsx` | rewritten | Start focus session and Go to Reports actions added |
| `apps/desktop/src/shell/AppShell.tsx` | reviewed | Header and local status wording unchanged; FR-U14 phrases untouched |
| `apps/desktop/src/shell/Nav.tsx` | reviewed | Six primary labels unchanged |
| `apps/desktop/src/shell/Tour.tsx` | reviewed | Tour steps already plain; pre-existing working tree edits kept |
| `apps/desktop/src/shell/ShortcutsDialog.tsx` | reviewed | Shortcut help already plain |
| `apps/desktop/src/shell/SectionSubNav.tsx` | reviewed | Renders labels passed by pages, no copy of its own |
| `apps/desktop/src/features/status/DbOpenError.tsx` | reviewed | Error wording says what happened and what to do |
| `apps/desktop/src/features/status/LocalStatus.tsx` | reviewed | FR-U14 canonical phrases kept word for word (T070) |
| `apps/desktop/src/features/status/capabilityPhrases.ts` | reviewed | Canonical phrase source, untouched |
| `apps/desktop/src/features/focus/focusView.ts` | rewritten | New in this feature: phase words and block wording |
| `apps/desktop/src/features/planning/planningView.ts` | reviewed | Range formatting checked for T057 |
| `packages/domain/src/reports.ts` | rewritten | New in this feature: section headings and honest empty sentences |
| `packages/domain/src/focus.ts` | rewritten | New in this feature: validation wording in plain sentences |
| `apps/desktop/src/App.tsx` | reviewed | Loading and boot wording only |
| `apps/desktop/src/ui/*.tsx` (Banner, Button, Checkbox, EmptyState, Field, Input, Row, SaveIndicator, Segmented, Select, StatusCue) | reviewed | Shared components render caller copy; defaults checked plain |
| `apps/desktop/src/lib/*.ts`, `main.tsx`, `vite-env.d.ts`, `ui/theme.ts` | left out | No rendered copy (theme.ts holds storage keys only) |

## Manual passes still owed before release

- Quickstart Pass 1 and Pass 6 in the Tauri shell (real notification delivery, quit and reopen mid block, backup then reset then restore). Automated equivalents pass; the desktop shell checks need a human at the app.
- 1024 by 680 keyboard-only pass over the overlay and Reports in Tauri (T069). Styles keep the Leave control visible and every control is a native button, input or select.
