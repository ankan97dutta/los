# Contracts: Focus, Reports, Themes and Copy

**Feature**: `specs/005-focus-reports-ux-refresh` | **Date**: 2026-10-20
These are the interfaces between layers for this feature. Names are binding for tasks; bodies are not specified here.

## App-services: focus (`packages/app-services/src/focus.ts`)

All functions take `WorkspaceRuntime` first and return the existing `Result` shape. Errors use worded messages fit to show as-is.

| Function | Input | Output | Notes |
|----------|-------|--------|-------|
| `focusStart` | `{ taskKind, taskRef?, intention?, technique }` | `{ session }` | Fails with `FOCUS_ALREADY_ACTIVE` and the active session when one is running, paused or on break. On success it also saves the technique and Custom lengths as the last used focus preferences |
| `focusGetActive` | none | `{ session \| null }` | Runs reconcile first |
| `focusPause` | `{ sessionId }` | `{ session }` | Only from `running` |
| `focusResume` | `{ sessionId }` | `{ session }` | Recomputes `focusEndsAt` from `pausedRemainingSeconds` |
| `focusEndEarly` | `{ sessionId }` | `{ session }` | Applies the under 60 seconds rule |
| `focusStartBreak` | `{ sessionId }` | `{ session }` | Long break after `setSize` blocks, says so in the returned session |
| `focusStartNextBlock` | `{ previousSessionId }` | `{ session }` | New row, `blockIndex + 1`, same task and technique |
| `focusClose` | `{ sessionId, markTaskDone? }` | `{ session }` | Only path that may change a linked action, and only on explicit `markTaskDone` |
| `focusTodaySummary` | `{ localDate }` | `{ blocks, focusedMinutes }` | Derived from `finishedLocalDate` |
| `focusReconcile` | none | `{ session \| null }` | Expired running becomes `focusDone`, expired break becomes `breakDone`, counted seconds capped at plan |

Desktop wrapper names in `apps/desktop/src/lib/api.ts` mirror these as `api.focusStart` and so on.

## App-services: reports (`packages/app-services/src/reports.ts`)

| Function | Input | Output | Notes |
|----------|-------|--------|-------|
| `reportPeriods` | `{ reportType, today }` | `{ periods: [{ periodStart, periodEnd, label, periodComplete }] }` | Current period first, then past, newest first. Never future |
| `reportGenerate` | `{ reportType, periodStart }` | `{ draft, sections }` | Returns the saved draft untouched if one exists; builds and stores otherwise |
| `reportGet` | `{ reportType, periodStart }` | `{ draft \| null, sections }` | No generation side effect |
| `reportSaveEdits` | `{ draftId, title?, summary?, sections?: [{ sectionKey, heading?, body }], addSection?, removeSectionKey? }` | `{ draft, sections }` | Sets edited markers on anything the lead changed |
| `reportRefresh` | `{ draftId }` | `{ draft, sections, updatedSectionKeys }` | Merge rule from data-model.md |
| `reportCopyText` | `{ draftId }` | `{ text }` | Title, period line, summary, then each section as heading plus body, joined with blank lines. No app wording, no theme or markup. For a running period the period line ends at today |

Repository range rule for all report reads: ranges are inclusive at both ends, planning periods qualify by overlap with the range, and completed actions qualify only by `completedAt` inside the range (never by `updatedAt`).

Domain builder contract (`packages/domain/src/reports.ts`): `buildReportDraft(facts, period)` is pure and deterministic. `facts` is a plain object with the gathered lists and counts from research R5. Empty inputs produce the honest empty sentences defined there, never zeroes dressed as results.

## UI: routes, palette and entry points

- Reviews sections become `reviews-calendar`, `reviews-monthly`, `reviews-history`, `reviews-reports`. Primary nav, digits and `primaryOf` behaviour do not change. Default child of Reviews stays Calendar.
- Command palette gains a `Focus` group with `Start focus session`, and a `Go to Reports` navigate action to `reviews-reports`. Existing groups and actions are untouched.
- Focus entry points: a Focus button on Today next to the main action, a Focus action per row on Personal Actions, a Focus action per candidate item on Planning, and the palette. Each opens the overlay with the item preselected. No more than 2 user actions from page to running timer (SC-001).
- While a session is active and the overlay is closed, the shell header shows a chip: technique, remaining time, state word (Focusing, Paused, Break, Done). Activating it reopens the overlay. The chip is a button with an accessible name.
- An App level watcher, mounted in `App.tsx` beside the overlay, ticks once per second while any session is active. Each tick reconciles the session, updates the chip countdown, and, when the overlay is closed or the document is hidden, fires the end of phase handling exactly once per session id and phase: in-app wording state, sound if the overlay is open, and `notifyFocusEnded`. Closing or reopening the overlay never resets its fired markers.

## UI: focus overlay

- Overlay over a dimmed, inert page. `role="dialog"`, `aria-modal`, labelled by the task wording.
- Contents in order: task or intention, technique name, time left in `mm:ss`, block wording ("Block 2 of 4"), phase word, then Pause or Resume, End session, Leave.
- Keyboard: focus lands on the primary control on open, Tab stays inside, Escape means Leave. Leave never ends the session.
- Live region announces phase changes in words ("Focus block done. Time for a 5 minute break."). Sound fires alongside unless muted in settings.
- On `focusDone`: choices are Start break, Start next block, Close session. On `breakDone`: Start next block, Close session. Nothing is pre-armed or auto started.

## UI: notifications wrapper (`apps/desktop/src/lib/focusNotify.ts`)

- `notifyFocusEnded({ phase, taskLabel, includeTask })` returns one of `sent`, `denied`, `unavailable`, `off`, `preview`. It never throws. The notification body is the phase wording only ("Focus block done", "Break done") unless `includeTask` is true, which only happens when the focus notifications include task setting is on.
- Called by the App level watcher only when the overlay is closed or the document is hidden at the moment a phase ends, once per session id plus phase.
- Settings wording: preview shows `Notifications: n/a (browser preview)`. Tauri denied shows `System notifications are unavailable. In-app alerts still work.` Neither blames the user.

## UI: reports panel

- Controls in order: type segmented control (Monthly MBR, Quarterly QBR), period select, Generate or draft state, then Refresh, Copy, Print actions.
- Removing a section the lead has edited asks for confirmation first. Every removal, edited or not, shows an Undo action that restores the section text, heading and place. Undo remains available until the lead leaves the Reports tab or removes another section.
- Running period drafts show "Covers 1 Sep to today, 20 Oct 2026. This period is still running." above the title. The same line, with today as the end date, is what `reportCopyText` emits and what print shows. The future period end never appears as covered.
- After Refresh, a status line names updated sections or says "Everything was already up to date. Your edited sections were kept."
- Print sends only the report article. Print stylesheet hides shell, panels and buttons, forces light background and dark text, and sets a readable serif-free body at 11 to 12 pt.

## UI: theme contract

- Root attributes: `data-theme` is `dark` or `light`; `data-accent` is `default`, `ember` or `signal`. Both are set by `initTheme` and `initAccent` in `apps/desktop/src/main.tsx` before `createRoot` renders, so the first paint already has the pairing.
- Token rule: accent blocks may only change `--accent`, `--accent-strong`, `--accent-dim`, `--on-accent`, `--focus-ring`, and, where this contract requires separation, `--danger`, `--warning`, `--status-warning`, `--status-conflicted`, `--status-danger`. Background, border and text tokens stay appearance owned.
- Contrast pairs that must be checked and recorded for all six combinations: `--text` on `--bg`, `--muted` on `--bg`, `--on-accent` on `--accent`, danger wording on `--bg-elevated`, warning wording on `--bg-elevated`, conflicted wording on `--bg-elevated`. Body pairs target the same readability as the current default theme; the check is the manual spot check from SC-009 plus hex values recorded in evidence.
- Settings holds two selects: Appearance and Primary color. Changing one never touches the other. Both apply instantly with no reload and mid edit drafts on the page are untouched (theme state never remounts page content).

## Copy contract

- No em dash character and no en dash character in any string under `apps/desktop/src`, `packages/domain/src` or `packages/app-services/src`. Ranges use "to". This includes comments that could reach the screen through templates; simplest compliant posture is zero anywhere in those trees outside the allowlist.
- Banned stock phrases (case insensitive): "leverage", "empower", "supercharge", "in today's fast paced world", "take your work to the next level", "seamless", "cutting edge", "world class", "game changer", "unlock the power".
- `apps/desktop/scripts/check-copy.mjs` enforces both lists, prints `file:line` hits, exits nonzero on any hit. `check-copy.allowlist.json` beside it holds path plus reason pairs for verbatim outside quotes only.
