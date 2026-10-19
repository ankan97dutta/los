# Feature Specification: Foundational LOS Desktop Workspace

**Feature Branch**: `feature/001-foundation-workspace`

**Created**: 2026-10-19

**Status**: Clarified

**Input**: User description: "Build the foundational LOS desktop workspace for an engineering lead. The user must be able to open LOS, capture an incoming request into an inbox, review and triage captured items, maintain personal actions, and organize work around daily, fortnightly, and monthly horizons. The application must persist data locally and remain usable offline. Daily reviews must support recording important outcomes, blockers, follow-ups, and next actions. Fortnightly planning must support selecting work and recording commitments. Monthly reviews must support recording improvement priorities. Provide a simple application structure for four applications and allow personal actions to be linked to an application. Include a system-tray entry point and a quick-capture workflow. Jira, Confluence, and LLM features are explicitly outside the scope of this first feature."

## Clarifications

### Session 2026-10-19

- Q: How should the current fortnight planning period be defined for history and “current period” navigation? → A: Fixed calendar fortnights aligned to a start weekday (e.g. every other Monday)
- Q: Should the “next actions” section in a daily review create or link to Personal Action items, or stay as free-text notes only? → A: Saving next actions always creates new Personal Actions
- Q: How should daily reviews, fortnight plans, and monthly reviews persist user edits? → A: Autosave shortly after edits, with visible saved/unsaved status
- Q: How should the four application slots appear the first time a lead opens LOS? → A: Pre-created as “Application 1”–“Application 4” (user renames anytime)
- Q: Must quick capture be available via a global keyboard shortcut in this feature, or is tray/in-app entry enough? → A: Global shortcut required when the OS permits; tray + in-app always available
- Q: (Analyze remediation) Backup/restore, keyboard paths, next-action edit rules, “newly captured”, max length, autosave reuse → A: FR-022/FR-023; newest-first inbox; 4000-char limit; next-action lineId rules locked; shared autosave for all review editors

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open LOS and capture to inbox (Priority: P1)

An engineering lead opens LOS on their desktop and immediately captures an incoming request into a personal inbox without leaving their flow of thought. The capture is saved locally and remains available after quitting and reopening the app, including with no network connection.

**Why this priority**: Capture is the entry point for all later triage and planning; without reliable local capture, the workspace has no durable value.

**Independent Test**: Launch LOS offline, capture a request into the inbox, quit, relaunch offline, and confirm the item is still present with the same content.

**Acceptance Scenarios**:

1. **Given** LOS is not running, **When** the lead launches LOS, **Then** the workspace opens without requiring an account, cloud sign-in, or network connectivity.
2. **Given** the lead is in the workspace, **When** they capture a new incoming request with a short description, **Then** the item appears at the top of the open inbox (newest-first); no separate unread badge is required.
3. **Given** an inbox item was just captured, **When** the lead quits and relaunches LOS with network unavailable, **Then** the inbox item is still present unchanged.
4. **Given** the lead attempts to capture with an empty description, **When** they submit, **Then** the capture is rejected with a clear message and no empty inbox item is created.

---

### User Story 2 - Triage the inbox (Priority: P2)

The lead reviews inbox items and triage each one: convert it into a personal action, keep it for later, or dismiss it as not actionable.

**Why this priority**: An inbox without triage becomes noise; triage turns capture into owned work.

**Independent Test**: Seed several inbox items, triage one to a personal action, dismiss another, and leave one untouched; verify resulting lists without using planning horizons.

**Acceptance Scenarios**:

1. **Given** one or more inbox items exist, **When** the lead opens the inbox, **Then** they see items ordered with newest first (or another clearly labeled stable order).
2. **Given** an inbox item, **When** the lead converts it to a personal action, **Then** a personal action is created with the item’s description, and the inbox item is no longer open in the inbox.
3. **Given** an inbox item, **When** the lead dismisses it, **Then** it is removed from the open inbox and does not appear as an active personal action.
4. **Given** an inbox item, **When** the lead chooses to keep it for later, **Then** it remains in the inbox and is still visible on the next open.

---

### User Story 3 - Maintain personal actions linked to applications (Priority: P3)

The lead maintains a list of personal actions and can optionally link each action to one of four applications that represent the lead’s delivery areas. They can mark actions done or reopen them.

**Why this priority**: Personal actions are the durable worklist; linking to applications gives lightweight structure without external tools.

**Independent Test**: Create actions with and without an application link, complete one, and verify filters/lists reflect status and links—without inbox or review features.

**Acceptance Scenarios**:

1. **Given** a first launch with no prior data, **When** the lead views applications, **Then** they see exactly four slots pre-named “Application 1” through “Application 4”, each renameable.
2. **Given** a personal action, **When** the lead links it to one application, **Then** the action shows that application association and can be listed in that application’s context.
3. **Given** a personal action linked to an application, **When** the lead clears the link, **Then** the action remains but is unassigned.
4. **Given** an open personal action, **When** the lead marks it done, **Then** it moves out of the open actions list and can be found among completed actions.
5. **Given** a completed personal action, **When** the lead reopens it, **Then** it returns to the open actions list.

---

### User Story 4 - Complete a daily review (Priority: P4)

At the end of (or during) a day, the lead records important outcomes, blockers, follow-ups, and next actions for that day so the day has a durable personal record.

**Why this priority**: Daily review is the shortest planning horizon and creates continuity between capture/actions and longer planning cycles.

**Independent Test**: Open today’s daily review, fill the four record areas, save, reopen later offline, and confirm the same content—without fortnightly or monthly features.

**Acceptance Scenarios**:

1. **Given** the lead opens the daily review for today, **When** the view loads, **Then** they can record important outcomes, blockers, follow-ups, and next actions as distinct fields or sections.
2. **Given** the lead has entered daily review content, **When** autosave completes (shown as saved), **Then** the content is available after relaunch offline.
3. **Given** a previous day’s review exists, **When** the lead navigates to that day, **Then** they can read the recorded content without altering today’s review.
4. **Given** the lead opens a day with no prior review, **When** the view loads, **Then** empty sections are ready for input and no error is shown.
5. **Given** the lead has entered one or more next-action lines in today’s daily review, **When** autosave completes for that review, **Then** each next-action line becomes a new open Personal Action (and remains visible in the daily review record for that day).
6. **Given** the lead leaves the next-actions section empty, **When** autosave completes, **Then** no new Personal Actions are created from that section.
7. **Given** the lead is editing a daily review, **When** edits are in flight before autosave finishes, **Then** the UI shows an unsaved/saving state so the lead knows persistence is not yet confirmed.

---

### User Story 5 - Plan a fortnight (Priority: P5)

For the current fortnight, the lead selects work to focus on and records commitments they intend to honor in that period.

**Why this priority**: Fortnightly planning turns ongoing actions into a time-bounded commitment set without external trackers.

**Independent Test**: Open the current fortnight plan, select existing personal actions and/or note commitments, save, relaunch offline, and confirm the plan—without monthly review.

**Acceptance Scenarios**:

1. **Given** the lead opens fortnightly planning for the current fixed calendar fortnight, **When** the view loads, **Then** they can see or select candidate work and record commitments for that fortnight (period boundaries do not slide day-to-day).
2. **Given** open personal actions exist, **When** the lead selects one or more for the fortnight, **Then** those selections are associated with the current fortnight plan.
3. **Given** the lead records a free-text commitment, **When** autosave completes, **Then** the commitment appears in the fortnight plan after relaunch.
4. **Given** a prior fortnight has a saved plan, **When** the lead opens that period, **Then** they can view historical selections and commitments without changing the current fortnight.

---

### User Story 6 - Complete a monthly review (Priority: P6)

Once a month, the lead records improvement priorities so systemic improvements are captured separately from daily noise and fortnight commitments.

**Why this priority**: Monthly review closes the planning loop with longer-horizon improvement focus; valuable after shorter horizons exist.

**Independent Test**: Open the current month’s review, record improvement priorities, save, relaunch offline, and confirm content.

**Acceptance Scenarios**:

1. **Given** the lead opens the monthly review for the current month, **When** the view loads, **Then** they can record one or more improvement priorities.
2. **Given** improvement priorities were autosaved, **When** the lead relaunches offline, **Then** the same priorities are shown for that month.
3. **Given** a previous month’s review exists, **When** the lead navigates to it, **Then** they can read it without changing the current month’s review.

---

### User Story 7 - System tray and quick capture (Priority: P7)

The lead uses a system-tray entry point to open LOS or trigger quick capture without navigating through a full window first, so interrupting work to park a request is cheap.

**Why this priority**: Tray + quick capture improves adoption of P1 capture but depends on a working workspace; prioritized after core lists and reviews.

**Independent Test**: With LOS running in the background, use the tray to open the main workspace and to capture an item into the inbox in a minimal flow.

**Acceptance Scenarios**:

1. **Given** LOS is running, **When** the lead uses the system-tray entry point to open the workspace, **Then** the main workspace becomes available/focused.
2. **Given** LOS is running and the OS permits global shortcuts, **When** the lead invokes the configured global quick-capture shortcut, **Then** they can enter a short description and submit into the inbox without completing a full triage flow.
3. **Given** LOS is running, **When** the lead starts quick capture from the tray, **Then** they can capture into the inbox with the same minimal flow as the global shortcut.
4. **Given** a quick-captured item (shortcut or tray), **When** the lead opens the inbox, **Then** the item appears like any other inbox capture.
5. **Given** tray and/or global shortcuts are unavailable on the host, **When** the lead uses the normal application window, **Then** in-app capture, triage, actions, and reviews remain fully usable.

---

### Edge Cases

- Empty inbox, empty actions list, and empty review periods must render clear empty states (not errors).
- Capture and action descriptions longer than **4000** characters are rejected with an actionable message; text is never silently truncated.
- Quitting mid-edit: persisted content must not leave the workspace in a corrupt state; at worst the last successful autosave is restored. Unsaved/in-flight edits may be lost only if autosave has not yet completed, and the UI must have shown unsaved/saving state.
- Clock/timezone changes: daily/fortnightly/monthly views resolve to a single consistent “current” period per open; navigating history remains by explicit period, not by ambiguous “now.”
- Fortnight boundaries use fixed calendar fortnights aligned to a configured start weekday; the “current” fortnight does not roll forward merely because the clock advances within the same fortnight.
- Linking an action to an application after renaming that application keeps the association to the same application slot.
- Completing an action that was selected in the current fortnight keeps historical fortnight selection visible as completed/selected work, without resurrecting the action as open.
- Re-saving a daily review must not duplicate Personal Actions for unchanged next-action lines. Rules: (1) each line has a stable `lineId`; (2) first non-empty autosave creates a Personal Action linked to that `lineId`; (3) later autosaves update the linked action’s description only while that action is still `open`; (4) clearing or removing a line does **not** delete the Personal Action.
- Offline mode is the normal mode for this feature; no banner may require connecting to continue core workflows.
- Duplicate rapid captures create separate inbox items (no silent merge) unless the user explicitly consolidates later (out of scope to auto-merge).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: LOS MUST launch as a local desktop workspace without requiring an account, cloud backend, or network connectivity.
- **FR-002**: Users MUST be able to capture an incoming request into an inbox with a non-empty description.
- **FR-003**: LOS MUST persist inbox items, personal actions, application names, daily reviews, fortnight plans, and monthly reviews locally so they survive restart.
- **FR-004**: Core capture, triage, actions, and planning/review workflows MUST remain fully usable while offline.
- **FR-005**: Users MUST be able to triage an inbox item by converting it to a personal action, keeping it for later, or dismissing it.
- **FR-006**: Users MUST be able to create, edit, complete, and reopen personal actions independent of inbox triage.
- **FR-007**: The workspace MUST provide exactly four application slots, pre-created on first launch as “Application 1” through “Application 4”, each with a user-editable display name.
- **FR-008**: Users MUST be able to link a personal action to at most one of the four applications, or leave it unassigned.
- **FR-009**: Users MUST be able to record daily review content for a given day covering important outcomes, blockers, follow-ups, and next actions as distinct sections.
- **FR-019**: When a daily review autosaves, each non-empty next-action line MUST materialize via a stable `lineId`: create an open Personal Action on first save, update that action’s description on later saves only while it remains `open`, and never delete the action when the line is cleared or removed. Important outcomes, blockers, and follow-ups MUST remain review-only text and MUST NOT auto-create Personal Actions.
- **FR-010**: Users MUST be able to open a fortnightly plan for the current fixed calendar fortnight (14-day periods aligned to a configured start weekday), select work (including existing personal actions), and record commitments.
- **FR-018**: LOS MUST expose which weekday anchors fortnight boundaries and MUST keep that anchor stable once set for the installation (changing it is allowed only via an explicit user action, not implicitly).
- **FR-011**: Users MUST be able to open a monthly review for the current month and record improvement priorities.
- **FR-012**: Users MUST be able to navigate to prior days, fortnights, and months to read historical review/plan content without overwriting the current period.
- **FR-013**: LOS MUST provide a system-tray entry point to open the workspace when the host environment supports tray integration.
- **FR-014**: LOS MUST provide a quick-capture workflow that creates an inbox item with minimal steps, reachable from (a) a global keyboard shortcut when the OS permits, (b) the system tray when tray integration is available, and (c) the main workspace always.
- **FR-021**: When the OS denies or lacks global shortcut support, LOS MUST still satisfy all non-shortcut requirements and MUST NOT block core workflows; shortcut absence MUST be understandable (e.g., settings/status), not a hard failure.
- **FR-015**: LOS MUST clearly indicate offline/local-only operation for this feature (no false implication that Jira/Confluence/LLM sync is active).
- **FR-016**: This feature MUST NOT require Jira, Confluence, or LLM capabilities; those integrations MUST remain unavailable or unused without blocking any requirement above.
- **FR-017**: Invalid or empty required inputs MUST be rejected with actionable feedback; LOS MUST NOT silently discard user-entered review or plan content after a successful save acknowledgment.
- **FR-020**: Daily reviews, fortnight plans, and monthly reviews MUST autosave shortly after edits and MUST show a visible saved, saving, or unsaved status so the user can tell whether persistence has completed.
- **FR-022**: Primary in-app workflows (inbox capture, inbox list triage, personal actions, daily/fortnight/monthly editors) MUST be operable via keyboard (focusable controls and a documented path to reach capture without a pointing device). Global quick-capture shortcut remains as specified in FR-014.
- **FR-023**: LOS MUST support a minimal local backup and restore of the workspace database file: the user can copy the DB file out as backup and replace it to restore, with documented location and a verified restore smoke path (no cloud backup required).

### Key Entities

- **Inbox Item**: A captured incoming request awaiting triage; has description, captured time, and open/triaged/dismissed disposition.
- **Personal Action**: An owned next step for the lead; has description, open/done status, optional link to one Application, and timestamps for create/update/completion as needed for listing.
- **Application**: One of four local slots representing a delivery area; initially named “Application 1”–“Application 4”; has a user-editable display name; does not represent an external system of record in this feature.
- **Daily Review**: Per-day record with sections for important outcomes, blockers, follow-ups, and next actions. Next-action lines, when saved, produce corresponding new Personal Actions; the other three sections are free-text only.
- **Fortnight Plan**: Per-fortnight record keyed by a fixed calendar fortnight (start/end dates derived from the configured start weekday), including selected work (references to personal actions and/or noted items) and written commitments.
- **Monthly Review**: Per-month record of improvement priorities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A lead can launch LOS and capture a new inbox item in under 30 seconds from a cold start on a typical laptop, without network access.
- **SC-002**: After quit and relaunch with network disabled, 100% of previously saved inbox items, personal actions, and review/plan records for this feature are still present and readable.
- **SC-003**: Using only in-app navigation labels (no external docs), a lead can complete capture → triage to action → open today’s daily review and have all four daily sections autosaved in under 10 minutes.
- **SC-004**: 100% of P1–P6 acceptance scenarios pass in an offline test run (network disabled or equivalent).
- **SC-005**: Quick capture via global shortcut (when permitted), tray (when available), or the main workspace creates an inbox item in under 15 seconds of active user time.
- **SC-006**: At least 90% of first-time testers can rename the four applications and link an action to one of them without documentation beyond the UI.
- **SC-007**: No core workflow in this feature is blocked by the absence of Jira, Confluence, or LLM features (verified by checklist: those entry points are unused/disabled and no error requires them).

## Assumptions

- Single primary user per local installation for this feature (no multi-user accounts or sharing).
- “Four applications” means four persistent, renameable local slots—not integrations with external application portfolios. They ship pre-named Application 1–4; no first-run naming wizard is required.
- “Fortnight” means a fixed calendar 14-day planning period aligned to a configured start weekday (e.g. every other Monday). The workspace exposes a clear “current fortnight” and allows navigating adjacent fortnights. Default start weekday may be chosen at first use or with a sensible default in planning; it must remain stable unless the user explicitly changes it.
- “Month” means calendar month in the user’s local timezone.
- “Day” means calendar date in the user’s local timezone.
- Dismissed inbox items need not be permanently recoverable in this feature (soft-delete/archive can be deferred); open and converted items must remain consistent.
- A default global quick-capture shortcut is in scope; full arbitrary shortcut remapping UI may be minimal (change/disable) rather than a full keymap editor. In-app keyboard operability is required by FR-022.
- Target desktop OS for first delivery is macOS-first per plan; acceptance for shortcuts/tray is “when the host supports them,” with in-app paths always required.
- Notifications beyond tray presence (e.g., OS push reminders) are out of scope.
- Capacity calculations, dependency graphs, AI assistance, and external issue sync are out of scope.
- Cloud backup/sync is out of scope; minimal file-level backup/restore of the local DB is in scope (FR-023).
- Daily-review next actions are a deliberate bridge into the Personal Actions list; outcomes/blockers/follow-ups are reflective notes, not action factories.
- Inbox capture and personal-action create/edit also persist locally; review/plan screens specifically use short-delay autosave with status, rather than an explicit Save button as the primary path.
