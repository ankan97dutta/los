# Feature Specification: GitHub Feedback Button

**Feature Branch**: `feature/007-github-feedback`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "add feedback button to create issues directly into github project page"

## Clarifications

### Session 2026-11-07

- Q: Should Feedback ask the user to pick a feedback kind before opening GitHub? → A: Required kind: Bug, Idea, or Other (maps to GitHub labels/templates when available)
- Q: After LOS successfully opens the GitHub new-issue page, what should the in-app Feedback UI do? → A: Close Feedback and show a short confirmation that the browser was opened (not that the issue was filed)
- Q: When the feedback description is too long to prefill reliably in the GitHub link, what should LOS do? → A: Open GitHub with title and kind only; copy the full body to the clipboard and tell the user to paste
- Q: How should the selected feedback kind be applied on the GitHub new-issue page? → A: Prefer a configured issue form/template per kind; if missing, use blank new-issue with kind labels
- Q: Where should users be able to open Feedback in v1? → A: Settings and command palette only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send product feedback as a GitHub issue (Priority: P1)

An engineering lead using LOS notices a bug, missing behavior, or improvement idea. They open Feedback from the app, choose a required kind (Bug, Idea, or Other), write a short title and description, review what will leave the device (including optional app/version context), and continue. They land on the LOS GitHub project issue surface with that content ready—and the chosen kind applied via label or issue template when available—so they can finish creating the issue under their own GitHub account.

**Why this priority**: This is the whole feature—closing the gap between using the app and filing trackable product feedback without hunting for the repository URL.

**Independent Test**: From a packaged or Tauri-dev build, open Feedback, enter title and body, continue, and confirm the GitHub new-issue flow opens with the content prefilled for the LOS project; completing submit on GitHub creates a visible issue.

**Acceptance Scenarios**:

1. **Given** the user is in LOS with network available and a form/template is configured for the selected kind, **When** they open Feedback, select that kind, enter a title and description, and continue, **Then** they reach that kind’s GitHub issue form/template with title prefilled when supported (body prefilled or clipboard-pasted per FR-003/FR-003b).
1a. **Given** no form/template is configured for the selected kind, **When** the user continues Feedback, **Then** they reach blank new-issue with kind labels applied and title/body handled per FR-003/FR-003b.
2. **Given** the user opens Feedback without selecting a kind, **When** they try to continue, **Then** continue is blocked until a kind is selected.
3. **Given** the user opens Feedback, **When** they view the draft before continuing, **Then** they can see exactly which optional diagnostic fields (for example app version and platform) will be included and can edit or remove them from the description.
4. **Given** LOS successfully opens the GitHub new-issue page, **When** the handoff completes, **Then** the Feedback UI closes and LOS shows a short confirmation that the browser was opened—not that an issue was already filed.
5. **Given** the user completes or abandons issue creation on GitHub, **When** they return to LOS, **Then** core local workflows are unchanged and no GitHub credentials were required inside LOS.

---

### User Story 2 - Find Feedback without disrupting daily work (Priority: P2)

A lead wants to report something without memorizing a URL. Feedback is discoverable from Settings and the command palette with a clear label (no always-visible shell chrome for Feedback in v1), and opening it does not discard unsaved Today/Inbox work.

**Why this priority**: Discoverability determines whether feedback actually gets filed; it must not interrupt primary capture or save flows.

**Independent Test**: Locate Feedback from Settings (and command palette if offered), open it, cancel or dismiss, and confirm the previous screen and any in-progress local edits remain intact.

**Acceptance Scenarios**:

1. **Given** the user is on any primary workspace screen, **When** they open Settings and choose Feedback, **Then** the feedback entry flow appears without navigating them away from their local data permanently.
2. **Given** the feedback flow is open, **When** they cancel or dismiss it, **Then** they return to where they were and no issue is created and no local workspace data is altered.
3. **Given** command palette search is available, **When** the user searches for “feedback” (or equivalent), **Then** Feedback is listed and opens the same flow as Settings.

---

### User Story 3 - Stay productive when GitHub is unreachable (Priority: P3)

A lead is offline or GitHub cannot be opened. They can still draft feedback text locally in the flow, understand that sending requires the browser/GitHub step, and copy their draft or retry later without LOS blocking Today, Inbox, Planning, or other core paths.

**Why this priority**: Constitution requires network-dependent features to degrade without blocking core lead workflows.

**Independent Test**: Simulate offline or failed open of the external issue page; confirm a clear message, preserved draft text, and uninterrupted use of Today/Inbox afterward.

**Acceptance Scenarios**:

1. **Given** the device is offline or the system cannot open the GitHub issue page, **When** the user tries to continue from Feedback, **Then** LOS shows a clear non-blocking message that feedback could not be opened externally and does not freeze or disable core navigation.
2. **Given** continue failed, **When** the user chooses to copy their draft or dismiss, **Then** their typed title/body remain available to copy or they can close and keep working locally.

---

### Edge Cases

- Missing kind: continue is blocked until Bug, Idea, or Other is selected.
- Empty title or empty body: continue is blocked with a clear validation message until both have meaningful content (whitespace-only counts as empty).
- Description too long to prefill reliably: LOS opens GitHub with title and kind only, copies the full description to the clipboard, and the post-handoff confirmation tells the user to paste the body into the issue.
- User has no GitHub account / is not signed in: they still reach GitHub’s page and must sign in there; LOS does not invent an alternate account.
- User cancels on the GitHub page without submitting: no issue exists; LOS only confirms the browser was opened, never that an issue was filed.
- Browser open succeeds but user never returns: Feedback is already closed; no further LOS prompts are required.
- Multiple rapid continues: does not spam many identical browser windows beyond a single clear attempt per confirm.
- Private or sensitive notes accidentally pasted into feedback: user is reminded that content will be shared publicly (or per repo visibility) before continuing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: LOS MUST provide a user-visible Feedback entry point from Settings. v1 MUST NOT add an always-visible shell control (sidebar/footer) dedicated to Feedback.
- **FR-002**: Feedback MUST collect a required kind (Bug, Idea, or Other), a title, and a free-text description before continue.
- **FR-003**: Continuing Feedback MUST open the LOS GitHub project’s new-issue experience in the user’s default browser (or OS-equivalent) so the user can create the issue under their GitHub identity. Kind handling MUST prefer a configured issue form/template for Bug, Idea, or Other when present; if that configuration is missing, LOS MUST open blank new-issue with the kind applied as labels. Title MUST be prefilled when the destination supports it; description MUST be prefilled when supported, otherwise the clipboard fallback in FR-003b applies.
- **FR-003a**: When the browser handoff succeeds, LOS MUST close the Feedback UI and MUST show a short confirmation that the browser was opened. LOS MUST NOT claim that a GitHub issue was created or filed.
- **FR-003b**: When the description cannot be prefilled reliably (length/encoding limits), LOS MUST still open GitHub with title and kind, MUST copy the full description to the clipboard, and MUST state in the confirmation that the body was copied for the user to paste.
- **FR-004**: Before continue, LOS MUST show that submitting shares the draft with GitHub (repo/project visibility) and MUST require an explicit user action to proceed—no silent background upload of feedback or workspace data.
- **FR-005**: LOS MUST NOT require a LOS account, stored GitHub token, or mandatory sign-in inside the app to use Feedback.
- **FR-006**: Optional diagnostic context (app version, platform/OS) MAY be appended to the description by default, MUST be visible to the user before continue, and MUST be editable or removable by the user.
- **FR-007**: Feedback MUST NOT include local workspace contents (reviews, inbox items, capacity data, database paths, or file contents) unless the user explicitly pastes them into the description.
- **FR-008**: When the external issue page cannot be opened, LOS MUST show a clear failure message and MUST leave core workflows usable.
- **FR-009**: Cancel/dismiss of Feedback MUST not create an issue and MUST not modify durable workspace data.
- **FR-010**: Feedback controls MUST be keyboard-reachable and expose an accessible name consistent with the desktop UX constitution.
- **FR-011**: Command palette MUST expose Feedback using the same flow as Settings.

### Key Entities

- **Feedback Draft**: Required kind (Bug, Idea, or Other), user-authored title and description, plus optional diagnostic lines the user has accepted for sharing; exists only for the feedback session unless the user copies it out.
- **GitHub Issue Target**: The configured public LOS repository/project new-issue destination where created issues become visible to maintainers for triage (including any maintainer-side project board automation outside LOS).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can open Feedback, select a kind, write a one-line title and short description, and reach the prefilled GitHub issue page in under 60 seconds without leaving the documented in-app path.
- **SC-002**: In moderated first-use tests, at least 9 of 10 participants successfully create a GitHub issue from the Feedback flow on the first attempt when online and signed into GitHub in the browser.
- **SC-003**: With network disabled, 100% of testers can dismiss or recover from the failed continue and complete a core local action (for example add a Today next-action line) immediately afterward.
- **SC-004**: Spot-check of created issues shows title/body match what the user confirmed in-app (including after paste when the clipboard fallback was used), and no workspace database fields appear unless the user pasted them.
- **SC-006**: In clipboard-fallback tests with an oversized description, 100% of testers see a confirmation that mentions paste, and the clipboard contains the full body they entered.
- **SC-005**: Zero Feedback paths require creating a LOS account or pasting a GitHub personal access token into the app.

## Assumptions

- “GitHub project page” means the LOS product’s GitHub repository Issues surface used for triage; maintainers may auto-add issues to a GitHub Project board outside the app.
- Creating the issue “directly” is satisfied by prefilling GitHub’s own new-issue flow in the browser; the user confirms submit on GitHub. In-app API issue creation with stored credentials is out of scope for this feature.
- The destination repository/project URL (or equivalent new-issue link) is a fixed product configuration for official LOS builds, not a per-user setting in v1.
- Feedback is an enhancement: offline and core lead workflows remain fully usable without it (Constitution I, III, X).
- Issue labels, templates, and project-board columns are owned on GitHub; LOS selects among the three kinds and prefills title/body when supported (and optional diagnostics). Kind-to-form/template/label mapping is fixed product configuration for official builds. Template preference does not block shipping: label-only blank new-issue is the required fallback.
- The three kinds are exactly Bug, Idea, and Other; no free-form custom kinds in v1.
- Windows/macOS both use the OS default browser opener; no embedded GitHub login webview is required in v1.
- Public issue visibility is acceptable for product feedback; users are warned before continue.

## Out of Scope

- Storing GitHub tokens or signing into GitHub inside LOS
- Creating or updating GitHub Project board cards via API from the app
- Always-visible shell Feedback control (sidebar/footer) in v1
- Attaching local screenshots/files automatically (user may attach on GitHub after open)
- In-app inbox of previously filed issues or status sync back into LOS
- Telemetry or silent crash reporting
- Non-GitHub feedback channels (email, chat)
