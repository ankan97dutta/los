# Quickstart: Focus, Reports and a Calmer LOS

**Feature**: `specs/005-focus-reports-ux-refresh` | **Date**: 2026-10-20
Validation guide only. Implementation lives in `tasks.md` (next step) and the implementation phase. Run automated suites first, then the manual passes, and record every result in `checklists/verification-evidence.md`.

## Setup

```bash
pnpm install
pnpm test            # domain, persistence, app-services suites stay green (SC-010)
pnpm dev             # Vite preview for UI passes
pnpm tauri:dev       # Tauri shell for notification and durable SQLite passes
```

Test data, whichever surface you use: two personal actions, one daily review with outcomes and blockers for a day this month, one closed planning period overlapping this month, and one monthly review with improvement priorities.

## Pass 1: focus session end to end (US1, SC-001 to SC-003)

1. Open Personal Actions. Choose Focus on an action. The overlay opens over the dimmed page in at most 2 actions.
2. Start Pomodoro. Confirm technique name, Block 1 of 4, ticking time, Pause and Leave.
3. Pause, wait, resume. Time picks up where it stopped.
4. Leave the overlay. The header chip shows the running session. Reopen from the chip.
5. Use a Custom 5 minute block to reach the end quickly. On finish, words announce the end, sound plays unless muted, and no break starts until you press Start break.
6. Start the break, let it end, start the next block, then end it early after a few seconds. It is not counted as a finished block and nothing scolds you.
7. Check Today and the overlay: finished blocks and focused minutes for today are shown.
8. Repeat a start in Tauri, close the app mid block, reopen after the deadline. The session shows as done, counted time capped at the planned minutes (SC-003).

Background alert check (Tauri only): start a short block, leave the overlay closed, switch to another app. The header timer keeps counting down and a system notification arrives saying only "Focus block done", with no task wording. Turn on "include task name in notifications" in Settings and repeat: the name now appears. Turn notifications off and repeat: no notification, in-app wording still appears on return. In Vite preview, Settings shows "Notifications: n/a (browser preview)".

## Pass 2: MBR and QBR reports (US2, SC-004, SC-005)

1. Go to Reviews, open the Reports tab. Pick Monthly (MBR) and the current month. Generate.
2. Read every figure against the source screens: done actions, the closed period totals, the monthly priorities. Anything missing says so in words (SC-004).
3. Edit the summary and one section. Leave and return. Your words are still there, with a saved state shown.
4. Record one more action as done, come back, Refresh. Only the sections you did not edit change, and the status line names them.
5. Remove the section you edited. A confirmation appears first; after removing, Undo brings it back with your words, heading and place intact.
6. Copy the report and paste into a plain editor. Clean text, headings, no app wording. Because this month is still running, the copied period line ends at today, not at the end of the month.
7. Print (or save as PDF from the print dialog). Light page, dark text, no sidebar or buttons, same covers to today line (SC-005).
8. Switch to Quarterly (QBR) for the current quarter. Bounds cover all three months. Delete the test data for one section, regenerate in a fresh period, and confirm the honest empty sentence appears instead of a zero.

## Pass 3: everyday jobs step counts (US3, SC-007, SC-008)

Measure before the UX changes (baseline, current build) and after, same scripts, one step means one click, command or field commit:

| Job | Script | Baseline steps | After steps |
|-----|--------|----------------|-------------|
| Capture an inbox item | Quick Capture to saved | record | must not rise |
| Start a focus session | Actions page to running timer | n/a new, count anyway | 2 or fewer |
| Check plan load | Planning open to load vs capacity read | record | must not rise |
| Open a past closed period | Reviews history to snapshot read | record | must not rise |
| Change theme | Settings open to new theme applied | record | must not rise |

At least 3 of these 5 must drop. Then repeat each job keyboard only: Tab and Enter throughout, visible focus the whole way, Escape backs out safely.

Insight check: at 1024 by 680, every primary screen shows its main answer in the first view, and collapsing detail never hides a conflict, error or closed period banner.

## Pass 4: copy check (US4, SC-006)

```bash
pnpm check:copy
```

Expected: no hits, exit 0. Then work through the copy inventory in the evidence file: every user facing surface is marked rewritten, reviewed with no change, or left out with a reason, including the fortnight plan, planning history, calendar, shell and the database error screen. Read the changed surfaces out loud. Short sentences, everyday words, date ranges written with "to", no phrases from the banned list in the contract.

## Pass 5: themes (US5, SC-009)

1. In Settings, walk all six pairings: Dark and Light, each with Default, Ember orange and Signal red.
2. On Inbox, Planning and the focus overlay, in each pairing: read body and muted text, find the primary button, the selected nav item and the focus ring.
3. In Signal red, make an error appear (for example a failed save) and confirm the wording and icon, not the shade, tell it apart from primary actions.
4. In Ember orange, open a conflicted plan and confirm warning and conflicted read apart from primary.
5. Restart mid pairing. The same appearance and color are active, and an in progress edit elsewhere was not cleared.

## Pass 6: guardrails (SC-010)

1. Turn the network off. Repeat Pass 1 step 1 to 5 and Pass 2 step 1. Everything works.
2. In Tauri, export a backup, reset, restore the backup. Focus history and report drafts are back.
3. Run the full test suite. All 001 to 004 suites green.
