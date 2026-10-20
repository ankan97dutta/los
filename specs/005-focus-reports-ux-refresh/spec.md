# Feature Specification: Focus, Reports and a Calmer LOS

**Feature Branch**: `feature/006-focus-reports-ux-refresh` (git) · **Feature dir**: `specs/005-focus-reports-ux-refresh`

**Created**: 2026-10-20

**Status**: Implemented, ready for review (manual Tauri passes T029, T041, T068, T069 still owed; see checklists/verification-evidence.md)

**Input**: User description: "Add focus mode for the user including techniques like Pomodoro. Review and humanize the content including title, header and body, remove traces of em and en dashes etc. Option to generate reports like MBR and QBR. Review the entire UX for minimal interaction and maximum insight, keep it clean. Provide two more additional themes, one with orange as primary and the other with red as primary color."

**Baselines**: Constitution v1.1.0; `specs/001-foundation-workspace/`; `specs/002-harden-foundation/`; `specs/003-fortnight-capacity/`; `specs/004-lead-command-ux/`. This feature builds on the shell, routes and design tokens from 004. It does not change the domain rules from 001 to 003.

## Clarifications

### Session 2026-10-20

- Q: Where should MBR and QBR reports live in the app navigation? → A: Inside Reviews as an in-section sub-nav tab (Monthly | Planning history | Reports). No seventh primary navigation item is added.
- Q: How should focus mode take over the screen while a session is running? → A: As an overlay panel on top of the current page, with the page dimmed behind it. It is not a dedicated page and not a floating widget.
- Q: Should Ember orange and Signal red be full standalone themes, or accent choices that pair with dark and light? → A: Accent choices that pair with dark and light. Appearance (Dark or Light) and Primary color (Default, Ember orange, Signal red) are two separate picker choices, giving six combinations.
- Q: When a saved report draft has your edits and new data arrives for the same period, what should Refresh do? → A: Update only the sections the lead has not edited. Edited sections stay untouched.
- Q: How should LOS tell you a focus block or break has ended when the app is in the background or the overlay is closed? → A: A system notification when LOS is in the background, plus words in the app. Notifications can be turned off in Settings.
- Q: What should happen when you remove a report section that you have edited? → A: Ask for confirmation, then remove it with an Undo option so the edited text can be brought back.
- Q: When you leave the focus overlay while a session is still running, what should keep track of the timer? → A: A header timer that counts down live, reopens the overlay in one click, and triggers the end alert when the block or break ends.
- Q: How far should the human writing review reach beyond the main screens? → A: Every user facing surface, recorded in a short inventory that says what was changed or deliberately left alone.
- Q: For a report on a month or quarter that is still running, where should the covers up to today wording appear? → A: On screen, in the copied text and in print, so the report reads honestly wherever it ends up.
- Q: When should LOS save your focus technique and Custom lengths as the ones to use next time? → A: As soon as a session starts with them.
- Q: What should a focus system notification say about what you were working on? → A: Generic wording by default, for example "Focus block done". The task or intention name is included only if the lead turns that on in Settings.
- Q: When a focus block finishes and you then take a break or close the session, at what point should that block count toward today's total? → A: The block counts at the moment the focus timer ends. Taking a break, starting the next step or closing the session afterwards never changes that count.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work on one thing with a focus timer (Priority: P1)

A lead picks one task or writes a short intention, starts a focus session, and works without the rest of the app competing for attention. The timer uses a known technique such as Pomodoro, tells the lead when it is time for a break, and keeps a simple count of what got done today. Nothing about the session is shared with anyone else.

**Why this priority**: Deep work is the daily habit this feature adds. Planning and reviews only help if the lead also gets time to do the work.

**Independent Test**: With no network, no Jira and no AI provider, pick an existing personal action, start a Pomodoro session, pause and resume it, let it finish, take a break, and confirm the completed session is counted for today.

**Acceptance Scenarios**:

1. **Given** the lead is on Today, Inbox, Personal Actions or Planning, **When** they choose Focus for an item or start Focus from the command palette, **Then** the focus overlay opens over the current page, dimming it, with that item as the current task in no more than 2 actions.
2. **Given** focus mode is open with no task picked, **When** the lead starts a session, **Then** they can type a short intention first, and they are not forced to create a task, project or other record to begin.
3. **Given** a technique is picked, **When** the session starts, **Then** the lead sees the task, the time left, the technique name and clear pause, resume and end controls.
4. **Given** a focus block ends, **When** the timer finishes, **Then** the lead gets a clear signal with words, not color alone, and a system notification if LOS is in the background and notifications are on, and can start the matching break, add another block, or leave. The next block never starts on its own.
5. **Given** a break ends, **When** the timer finishes, **Then** the lead is told the break is over and can choose to start the next focus block or stop for now.
6. **Given** the lead ends a session early, **When** they confirm, **Then** the session closes and they can mark the task done, keep it open, or just leave it as it was. Ending a timer never changes task state on its own.
7. **Given** the lead has finished sessions today, **When** they look at focus mode or Today, **Then** they see the number of finished blocks and the total focused time for today, with no streak, score or ranking language.
8. **Given** the lead closes the app or switches pages mid session, **When** they come back, **Then** the session is shown with time based on when it was due to end, never with negative time and never restarted from scratch without telling the lead.

---

### User Story 2 - Turn a month or a quarter into a report worth sending (Priority: P1)

At the end of a month or a quarter, a lead opens Reviews, picks the Reports tab, picks the period, and gets a Monthly Business Review (MBR) or Quarterly Business Review (QBR) draft built from what is already in LOS. The lead reads it, fixes the wording, then copies it or prints it to share in a meeting or a doc. The report says plainly where LOS has no data instead of filling gaps with invented numbers.

**Why this priority**: Leads already write these reports by hand from scattered notes. Pulling the first draft from work they have already recorded saves the most painful hour of the month.

**Independent Test**: Record a few completed actions, one monthly review and one closed planning period for a month. Generate an MBR for that month, edit the summary, copy the report, and print it. Repeat for the quarter that contains that month.

**Acceptance Scenarios**:

1. **Given** the lead opens Reviews and picks the Reports tab, **When** they pick MBR or QBR and a month or quarter, **Then** a draft appears for that exact period, and the period is named in plain words at the top, for example "Monthly review, September 2026".
2. **Given** the lead has data in the period, **When** the draft is built, **Then** it brings together the monthly review notes, completed actions, closed planning periods, capacity and load figures, team changes and focused time recorded in that period, each under a clear heading.
3. **Given** a section has no data in the period, **When** the draft is built, **Then** the section says so in plain words, for example "No closed planning periods in this period", and the report does not invent figures, names or outcomes.
4. **Given** a draft is on screen, **When** the lead edits the title, the opening summary or any section, **Then** the edits are kept when they leave and come back, and the saved state is shown in words.
5. **Given** the lead is happy with the draft, **When** they choose Copy or Print, **Then** they get the whole report in a clean reading layout with no app navigation, buttons or theme colors that hurt printing, and nothing is sent anywhere by the app itself.
6. **Given** a report was generated before, **When** the lead returns to that period and chooses Refresh, **Then** sections they have not edited are rebuilt from the latest data, sections they have edited stay word for word as they left them, and the draft says which sections were updated.
7. **Given** a period is still running, **When** the lead generates, copies or prints a report for it, **Then** each of those outputs says the report covers the period to today, with the end date shown as today, not as the future end of the period.
8. **Given** the lead removes a section they have edited, **When** they confirm the removal, **Then** the section disappears and an Undo option restores it with its edited text, heading and place in the report.

---

### User Story 3 - Less tapping around, more signal on every screen (Priority: P2)

The lead moves through Today, Inbox, Planning, Team, Reviews, Reports and Settings and finds each screen answers one question first: what needs my attention, what changed, or what do I do next. Common jobs take fewer steps than they do today, extra detail sits one step deeper, and the same patterns turn up in the same places on every screen.

**Why this priority**: The app already holds the right data. The gain now comes from showing the important part first and cutting steps from the jobs the lead does every day.

**Independent Test**: Without a pointer, do the five everyday jobs: capture an inbox item, start a focus session, check whether the current plan fits capacity, find a past closed period, and change the theme. Count the steps for each and compare them with the counts recorded before this feature.

**Acceptance Scenarios**:

1. **Given** the lead opens any primary screen, **When** the page loads, **Then** the first thing they see answers that screen's main question, with detail and history available below or behind a clear "Show more" style control.
2. **Given** a list or figure could mislead, **When** the lead views it, **Then** unknown, empty, conflicted and failed states are written in words next to the figure, never shown as a confident zero and never by color alone.
3. **Given** the lead repeats a common job, **When** they do it a second time, **Then** the app remembers the last sensible choices, such as the last focus technique, the last report type and the last theme, so they do not have to pick them again.
4. **Given** the lead prefers the keyboard, **When** they use capture, navigation, focus controls, report actions and the theme picker, **Then** every one of those jobs finishes without a pointer, with a visible focus indicator and a clear way back.
5. **Given** a screen has secondary or rarely used options, **When** the lead views the screen, **Then** those options do not push the main job off the first view, and no blocking popup appears for a choice that can safely be made later.
6. **Given** the lead makes a change that saves, **When** the save finishes or fails, **Then** they see saved, saving or save failed in words in the same place and style on every screen.

---

### User Story 4 - Words that sound like a person wrote them (Priority: P2)

Every title, heading, label, helper line, empty state, error and tour step in the app reads like plain, human writing. The lead never meets stiff machine style phrasing, and date ranges and numbers read the way a person would say them.

**Why this priority**: The lead reads these words all day while making decisions. Plain writing lowers the effort of every screen and makes the numbers easier to trust.

**Independent Test**: Run the copy check over the app's user facing text, then read the main screens, the tour, Settings and one generated report end to end and confirm the writing rules in FR-016 to FR-019 hold everywhere.

**Acceptance Scenarios**:

1. **Given** any screen, dialog, banner or menu in the app, **When** the lead reads the title, headings and body text, **Then** no em dash and no en dash characters appear anywhere in that text.
2. **Given** the app shows a date range, **When** the lead reads it, **Then** it is written with words, for example "1 Sep to 30 Sep 2026", not with a dash between the dates.
3. **Given** a screen has no data yet, **When** the lead opens it, **Then** the empty message says what belongs there and names the one next step that fills it.
4. **Given** something goes wrong, **When** the lead reads the error, **Then** it says what happened, what it means for their work, and what they can do next, in plain words and without blame.
5. **Given** the tour or a report template introduces itself, **When** the lead reads it, **Then** it sounds like a short note from a colleague, uses short sentences, and does not lean on stock phrases such as "leverage", "empower", "supercharge", "in today's fast paced world" or "take your work to the next level".

---

### User Story 5 - Two more themes, orange and red (Priority: P3)

Alongside the current default primary color, the lead can pick orange or red as the primary color, and keep using the dark or light appearance they already like. Both choices are remembered, everything stays readable, and status colors still mean what they meant before.

**Why this priority**: Personal feel matters in a tool that stays open all day, and the request is explicit. It is still polish, so it comes after focus, reports and the UX tidy up.

**Independent Test**: In Settings, pair each primary color with dark and with light on Inbox and Planning, restart the app, and confirm the last pairing is still active and warning, danger, unknown and conflicted states are still told apart by words or icons.

**Acceptance Scenarios**:

1. **Given** the lead opens Settings, **When** they look at the appearance choices, **Then** they see two separate choices: Appearance (Dark or Light) and Primary color (Default, Ember orange or Signal red).
2. **Given** the lead picks Ember orange with either appearance, **When** any primary screen renders, **Then** primary buttons, the selected navigation item, links and the focus ring use the orange primary color, and body text keeps the same contrast as the current themes.
3. **Given** the lead picks Signal red with either appearance, **When** a danger or error state appears on the same screen as primary actions, **Then** the danger state is still told apart from the primary color by words or an icon, never by a small shade change alone.
4. **Given** the lead picks Ember orange, **When** warning or conflicted states appear, **Then** they are still told apart from the orange primary color by words or an icon.
5. **Given** the lead restarts the app, **When** it opens again, **Then** the last picked appearance and primary color are both active on every screen, and switching either mid edit does not clear what they were typing.

---

### Edge Cases

- Focus timer finishes while the app is closed or the computer sleeps: on return, the session shows as finished at its due time, the lead is offered the break or the next step, and counted time never exceeds the planned block length.
- Lead starts a focus session, then opens a second one from another screen: focus mode shows the session already running and offers resume or end, rather than running two timers at once.
- Lead ends a session within the first minute: it is closed politely and is not counted as a finished block, and the lead is not scolded for it.
- A pause is left for hours: the session stays paused, the remaining time is kept, and no focus time beyond the planned block is recorded.
- Report period has data on its first and last day: both days are included. A quarter report includes all three months in full, including months with no data.
- Lead edits a report, then new data lands in the same period: the saved draft is not changed behind their back. When the lead chooses Refresh, only sections they never edited are rebuilt, edited sections keep their words, and the draft lists the sections that changed.
- Report is printed from the red or orange theme: the printout uses a light background and dark text, whatever theme is on screen.
- Red theme plus a screen full of errors, or orange theme plus conflicted plan warnings: text and icon cues carry the meaning, so the screen still reads correctly for anyone who cannot tell the colors apart.
- Computer clock is changed or the lead travels across time zones mid session: timers still end at the right moment and focus time for today is counted on the local day the block finished.
- Screen is narrow or the lead uses the keyboard only: the focus timer, its controls and the report actions stay reachable, and nothing important is hidden behind hover.

## Requirements *(mandatory)*

### Functional Requirements

**Focus mode**

- **FR-001**: LOS MUST provide a focus mode that the lead can open from Today, Inbox, Personal Actions and Planning, and from the command palette, in no more than 2 actions from any of those places.
- **FR-002**: Focus mode MUST let the lead work on one thing at a time: a picked personal action, a picked planning item, or a short intention typed for the session. Starting a session MUST NOT force the lead to create or edit a record first.
- **FR-003**: LOS MUST offer at least these techniques: Pomodoro at 25 minutes focus and 5 minutes break, Deep work at 50 minutes focus and 10 minutes break, and a Custom technique where the lead sets focus and break lengths between 5 and 180 minutes. The moment a session starts, the technique and any Custom lengths it used MUST be saved as the last used values and MUST be preselected the next time focus mode opens, without the lead visiting Settings.
- **FR-004**: After every 4 finished focus blocks in a row, LOS MUST offer a long break of 15 to 30 minutes. Breaks and the next focus block MUST only start when the lead chooses them. Nothing auto starts.
- **FR-005**: Focus mode MUST appear as an overlay panel on top of the current page, with the page behind it dimmed and not interactive while the overlay is open. The overlay MUST show the current task or intention, the technique name, time left, block number in the set, and pause, resume, end and leave controls. The way to leave MUST stay visible the whole time, and leaving the overlay MUST be possible without ending the session by accident. While a session runs with the overlay closed, the app header MUST show a live countdown with the technique and phase in words, and one click or keypress on it MUST reopen the overlay. That header timer is also what notices the end of a block or break while the overlay is closed, so the end alert in FR-006 fires exactly once per phase.
- **FR-006**: When a block or break ends, LOS MUST tell the lead with words plus a sound or visual signal that works when the screen is muted. When LOS is in the background, LOS MUST also send a system notification saying whether the focus block or break ended, where the operating system allows it. By default that notification MUST use generic wording, for example "Focus block done" or "Break done", and MUST NOT include the task or intention wording. Settings MUST offer a separate choice, off by default, to include the task or intention name in notifications, shown with plain wording about where notifications can appear. This notification MUST be turn offable in Settings, MUST send no data off the device, and if the system refuses or has no notification support, the in-app words and sound MUST still work and focus mode MUST say plainly that system notifications are off or unavailable. Color alone MUST NOT carry the message.
- **FR-007**: LOS MUST keep one running session at a time. Starting a second session MUST surface the running one with resume and end choices.
- **FR-008**: LOS MUST record each finished or ended session locally with the date, technique, planned and actual focused minutes, and the linked task or intention when there is one. Sessions ended in under 1 minute MUST NOT count as finished blocks. A focus block counts once, at the moment its focus timer reaches the end: the counted seconds (capped at the planned length) and the local day are fixed at that moment. Taking the break, starting the next block or closing the session afterwards MUST NOT add, remove or move that count. A session stays one record through its break and closing; the counted test is simply whether the focus timer reached the end and the session was not ended early.
- **FR-009**: Focus mode and Today MUST show today's finished blocks and total focused minutes, counting each block under the FR-008 rule (timer reached the end, fixed at that moment, on the local day it ended). This summary MUST stay private to the lead. There MUST be no sharing, ranking, streak pressure or manager view.
- **FR-010**: Ending a session MUST NOT change the state of a linked task unless the lead picks "mark done" at the end. Timers MUST survive page changes inside the app and give the right remaining time after the app is closed and reopened.

**Reports (MBR and QBR)**

- **FR-011**: LOS MUST provide Reports as an in-section tab inside Reviews, alongside Monthly and Planning history, with no seventh primary navigation item. On that tab the lead picks a report type, Monthly Business Review (MBR) for one calendar month or Quarterly Business Review (QBR) for one calendar quarter, and the period. The current and past periods MUST be pickable. Future periods MUST NOT be offered. Reports MUST also be reachable from the command palette.
- **FR-012**: LOS MUST build the draft only from data already held locally for that period: monthly review content, completed and carried over actions, closed planning periods with capacity, load and warnings, team roster changes, applications, and recorded focus time. Each section MUST show only figures that come from that data.
- **FR-013**: The draft MUST follow a fixed, readable structure: title and period, a short opening summary, highlights and wins, delivery and capacity, focus and workload, risks and blockers, key decisions, and priorities for the next period. Where LOS has no data for a section, the draft MUST say so in plain words. It MUST NOT invent figures, names, dates or outcomes.
- **FR-014**: The lead MUST be able to edit the title, the opening summary and every section, add or remove a section, and see the saved state in words. Drafts MUST be stored locally per report type and period, and reopening a period MUST show the last saved draft. Refresh MUST rebuild only sections the lead has not edited, MUST leave edited sections word for word unchanged, and MUST say which sections were updated. The title and opening summary count as edited once the lead changes them. Removing a section the lead has edited MUST ask for confirmation first and MUST offer Undo afterwards that restores the section with its edited text, heading and place in the report. Removing a section the lead has not edited MAY happen without confirmation but MUST also offer Undo.
- **FR-015**: LOS MUST let the lead copy the whole report as clean text and print it in a reading layout that hides app navigation and controls and uses a light background with dark text. For a period that is still running, the line saying the report covers the first day of the period to today MUST appear on screen, in the copied text and in the printed report, and copied or printed reports MUST NOT show the future end date as if it were already covered. Generating, copying or printing a report MUST NOT send data anywhere, need a network, need an account, or need an AI provider. An optional AI written summary MAY be offered later, but the report MUST be complete and useful without it.

**Writing and content pass**

- **FR-016**: Every user facing string in the app MUST be reviewed in this pass and MUST contain no em dash character and no en dash character. That means every surface the lead can read, including Today, Inbox, Personal Actions, Planning and the fortnight plan, Team, Reviews with planning history and the calendar, Reports, the focus overlay, Settings, the app shell and navigation, dialogs, the tour, and error screens such as the database open error. Date ranges MUST be written with "to". Number ranges MUST be written with "to" or words. The pass MUST leave a short inventory in the feature verification evidence listing each surface as rewritten, reviewed with no change needed, or left out with a reason. No surface may be silently skipped.
- **FR-017**: LOS MUST ship an automated copy check that scans user facing text for the em dash and en dash characters and fails when one is found, with a short documented allowlist only for text that quotes outside content. The check result MUST be recorded in the feature verification evidence.
- **FR-018**: Headings and body copy on primary screens MUST be rewritten in plain, human language: short sentences, everyday words, the lead spoken to as "you" where it helps, and no stock filler from the acceptance list in User Story 4. Page titles MUST say what the page is for in plain words.
- **FR-019**: Empty states MUST say what belongs in the space and name one next step. Errors MUST say what happened, what it means and what the lead can do next. Unknown values MUST be written as unknown, never as zero, a blank or a confident guess.

**Minimal interaction, maximum insight**

- **FR-020**: Each primary screen (Today, Inbox, Planning, Team, Reviews including its Reports tab, focus mode, Settings) MUST lead with the answer to its main question: what needs attention, what changed, or what to do next. Supporting detail MUST sit below that or behind a clearly labelled disclosure, and blocking warnings MUST stay visible even when detail is collapsed.
- **FR-021**: LOS MUST cut steps from the five everyday jobs measured for this feature: capture an inbox item, start a focus session, check plan load against capacity, open a past closed period, and change theme. The step counts before and after MUST be recorded in verification evidence, and no everyday job may take more steps after this feature than before.
- **FR-022**: LOS MUST remember the last used values for repeated choices, including focus technique and lengths (saved at session start, per FR-003), report type and period, and theme, and prefill them on return. Remembering MUST stay on this device.
- **FR-023**: Capture, navigation, starting and controlling a focus session, generating and copying a report, and changing theme MUST each be completable with the keyboard alone, with a visible focus indicator, accessible names on controls, and a clear way to cancel or go back. No primary job may depend on hover or drag.
- **FR-024**: LOS MUST use one shared pattern for save state (saving, saved, save failed), loading, empty, error and conflicted states across all primary screens. Save success and failure for durable writes MUST be shown in words, and destructive or hard to undo actions MUST stay confirmable.

**Themes**

- **FR-025**: Settings MUST offer two separate choices: Appearance (Dark, which is the current dark graphite, or Light) and Primary color (Default, Ember orange or Signal red). Picking a primary color MUST NOT change the appearance, and picking an appearance MUST NOT change the primary color.
- **FR-026**: Ember orange and Signal red MUST drive primary buttons, selected navigation, links, active controls and the focus ring in both appearances. Body, muted and status text contrast MUST be at least as readable as in the current themes in all six combinations, checked and recorded in verification evidence.
- **FR-027**: Status meaning MUST survive the new primary colors: in Signal red, danger and error MUST still be told apart from primary actions by words or icons; in Ember orange, warning and conflicted MUST still be told apart from the primary color by words or icons. Color alone MUST NOT carry any status in any combination.
- **FR-028**: The picked appearance and primary color MUST apply to every screen including the focus overlay and dialogs, MUST be remembered across restarts, and MUST NOT clear in progress edits when switched. Printed reports MUST ignore both and print light, as required by FR-015.

**Guardrails**

- **FR-029**: This feature MUST work fully offline with no account, no cloud service, no telemetry and no AI provider, and MUST NOT weaken any rule from 001 to 004, including data ownership, soft gate and freeze behavior in planning, and save honesty.
- **FR-030**: Focus records and report drafts MUST be included in backup and restore like other LOS data, and MUST NOT be silently discarded by theme changes, timer events or report refreshes.

### Key Entities

- **Focus Technique**: A named pattern with focus length, break length, blocks before a long break and long break length. Ships as Pomodoro, Deep work and Custom.
- **Focus Session**: One sitting of focused work. Holds the linked task or free text intention, technique, start, pause and end times, planned minutes, counted focused minutes, and an outcome of finished, ended early or still running.
- **Focus Day Summary**: Finished blocks and total focused minutes for one local day, derived from focus sessions whose focus timer reached the end on that day under the FR-008 rule.
- **Report Draft**: One MBR or QBR for one period. Holds report type, period start and end, title, opening summary, ordered sections with editable text, when it was generated, when it was last edited, and whether the period was still running when generated.
- **Report Section**: A titled block of a report draft, such as Highlights and wins, with its source kind (from review notes, from planning figures, from focus records, or written by the lead) and a marker for whether the lead has edited it, so Refresh only rebuilds untouched sections and empty sections stay honest.
- **Theme Choice**: The lead's picked pairing of appearance (dark or light) and primary color (default, ember orange or signal red), stored on this device.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a timed check, the lead can start a Pomodoro session on an existing action in 2 actions or fewer and in under 30 seconds, in 100 percent of at least 5 trials, with network off and no AI provider set up.
- **SC-002**: When a focus block or break ends, the end state is announced in words in 100 percent of trials, a system notification arrives when LOS is in the background and notifications are on in 100 percent of background trials, and no next block or break starts without the lead choosing it, in 100 percent of trials.
- **SC-003**: Closing and reopening the app mid session gives the correct remaining time or a correctly finished session in 100 percent of at least 5 trials, and counted focused time never exceeds the planned block length.
- **SC-004**: For a month with known test data, 100 percent of the figures in the generated MBR match the source data for that month, every section with no data says so in words, and no invented figure, name or date appears in a read through of the whole report.
- **SC-005**: The lead can generate an MBR or QBR, edit the summary and copy the full report in under 3 minutes, and printing produces a clean page with no navigation or buttons, in 100 percent of at least 3 trials.
- **SC-006**: The automated copy check finds zero em dash and zero en dash characters in user facing app text and report templates, and a human read of Today, Inbox, Planning, Reviews, Settings, the tour and one report finds no items from the banned stock phrase list.
- **SC-007**: Step counts for the five everyday jobs in FR-021 are recorded before and after, each job takes the same or fewer steps after, at least 3 of the 5 take fewer steps, and each of those jobs completes keyboard only in 100 percent of at least 3 trials.
- **SC-008**: On each primary screen, the main insight or next action is visible in the first view without scrolling at the documented minimum window size, and collapsed detail never hides a blocking warning, checked on all primary screens.
- **SC-009**: All six appearance and primary color combinations pass the documented manual spot check of body, muted and status text on Inbox, Planning and the focus overlay, and in Signal red a tester can tell danger from primary actions by words or icons alone, and in Ember orange a tester can tell warning and conflicted from primary by words or icons alone, in 100 percent of spot checks.
- **SC-010**: Every acceptance scenario in this feature passes with network disabled, integrations disconnected and AI providers absent, and the existing 001 to 004 automated test suites stay green.

## Assumptions

- The single user is the engineering lead already using LOS. Focus mode and reports are personal tools. There is no team, manager or shared view of focus data, and none will be added by this feature.
- Start points for focus mode follow the routes already in LOS: Today is the daily review, Personal Actions sits under Inbox, and Planning holds capacity planning. No new primary navigation item is needed for focus mode itself, since it opens over the current work. Reports lives inside Reviews as a third in-section tab (Monthly | Planning history | Reports), per the 2026-10-20 clarification, so the six primary destinations from 004 stay unchanged.
- Focus defaults are Pomodoro 25 and 5, long break after 4 blocks at 20 minutes, Deep work 50 and 10. These are starting points a lead would recognise. The lead can change them in Custom and in focus settings. Sound at the end of a block is on by default with a mute, and always comes with words on screen. System notifications for block and break endings are on by default where the operating system allows them, can be turned off in Settings, and use generic wording unless the lead turns on task names in notifications, per the 2026-10-20 clarifications.
- Focus sessions are stored locally as LOS owned data and travel with backup and restore. A session counts on the local day it finished. Only finished blocks and ended sessions over 1 minute add focused minutes.
- Report periods are plain calendar periods: a month runs from its first to its last day, and a quarter runs from the first day of its first month to the last day of its third month. The week start setting does not move these edges. A report for the running period covers the first day to today.
- Report figures come only from data the app already records today plus focus sessions from this feature. If a figure is not recorded anywhere, for example shipped release counts, the report leaves that to the lead to write. The lead stays the author. The app drafts, the lead decides.
- Export in this feature means copy as clean text and print, where print includes save as PDF through the computer's own print dialog. Sending by email, chat or any outside service is the lead's own step, outside the app.
- The writing pass covers the app's own English copy only. Text the lead typed, notes pasted in, and names synced from outside tools are their words and are never rewritten by the app. The copy check allowlist exists only for quoted outside text shown back verbatim.
- Ember orange and Signal red are primary color choices, not standalone themes, per the 2026-10-20 clarification. They pair with either appearance, so Dark plus Ember, Light plus Ember, Dark plus Signal and Light plus Signal all work, built on the shared tokens from 004 with neutral surfaces so the primary color stays the signal.
- Reviewing the UX for fewer steps means the primary screens listed in FR-020. It does not mean rebuilding domain logic, changing planning math, or moving data between screens. Where the audit finds a deeper problem, it is written up as a follow up rather than fixed quietly inside this feature.

## Out of Scope

- Blocking calls, muting other apps, calendar integration or any control over the computer outside LOS, such as do not disturb or full screen forcing.
- Sharing focus data with a team or manager, leaderboards, streaks, scores or any comparison between people.
- Sending reports by email, chat, Jira, Confluence or any outside service from inside the app, and scheduled or automatic report generation.
- Report formats beyond copy as clean text and print or save as PDF, such as slide decks or spreadsheet exports.
- Writing reports with an AI provider as the only path. An optional AI summary is a later feature with its own spec.
- Rewriting the lead's own notes, imported text or synced names to match the writing rules.
- New planning, inbox or review domain features found during the UX audit. Those get their own spec. This feature only fixes presentation, step counts and copy on the listed screens.
- Primary colors beyond Default, Ember orange and Signal red, per user custom colors, and automatic appearance switching by time of day or system setting.

## Dependencies

| Dependency | Impact |
|------------|--------|
| 004 shell, routes, command palette and design tokens | Focus mode entry points, Reports navigation, the theme picker and both new themes build on these |
| 001 daily review, personal actions and inbox data | Main sources for report content and the usual starting points for a focus session |
| 003 capacity planning periods and closed period history | Source of delivery and capacity figures in MBR and QBR reports |
| Monthly review and planning history surfaces | Source of review wording in reports, and one of the screens in the writing and UX pass |
| Backup and restore from 001 and 002 | Must cover focus sessions and report drafts, per FR-030 |
| Constitution v1.1.0 quality gates | Offline core, no LLM required, privacy default, test evidence and desktop UX gates all apply to this feature |
