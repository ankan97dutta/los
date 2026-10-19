# Feature Specification: Lead Command Center UX & Design System

**Feature Branch**: `feature/005-lead-command-ux` (git) · **Feature dir**: `specs/004-lead-command-ux`

**Created**: 2026-10-19

**Status**: Spec approved for implement; constitution **v1.1.0 applied**. Feature **complete** requires Desktop UX verification evidence (T058).

**Input**: Introduce a deliberate LOS UI/UX direction: premium engineering-lead command center—calm, precise, keyboard-friendly, information-dense but readable, local-first—with reusable design tokens/components, consistent shell/navigation, Today/Inbox/Planning/Team/Reviews experiences, capacity-planning information hierarchy, contextual editing and command-palette workflows, accessible states, without weakening 001–003 domain rules or requiring Jira/LLM.

**Baselines**: Constitution **v1.1.0**; `specs/001-foundation-workspace/`; `specs/002-harden-foundation/`; `specs/003-fortnight-capacity/` (including known incomplete UI vs FR-C05/C09/C12). Do not rewrite 003 acceptance criteria to hide gaps.

## Clarifications

### Session 2026-10-19 (pre-specify assumptions)

- Q: UI framework → A: **Stay on React + CSS variables / existing custom styles**. No MUI or Tailwind present today; do not introduce a second UI framework without a later ADR.
- Q: Theme → A: Restrained **dark graphite default** + polished **light theme** as design-system tokens (feature-level, not constitutional).
- Q: Nav IA → A: Group existing capabilities into **Today, Inbox, Planning, Team, Reviews/History, Settings** without inventing fake product modules.
- Q: 003 incomplete fields → A: **Separate tracks**: (A) UX shell/tokens/states for what exists; (B) explicit dependency notes for missing 003 business fields—do not fake data or mark 003 FRs complete via restyle alone.

### Session 2026-10-19 (clarify)

- Q: Where should Personal Actions live in the remapped shell so it stays reachable without inventing a fake module? → A: **Secondary under Inbox** (sub-nav / section link to ActionsPage); not a seventh primary nav item.
- Q: How should Team and Reviews combine their two backing surfaces each? → A: **In-section sub-nav/tabs** (Team: Roster \| Applications; Reviews: Monthly \| Planning history).
- Q: When may UI implementation start relative to the constitution v1.1.0 amendment? → A: **Code OK after spec approval**; feature “complete” blocked until constitution applied or written time-bounded exception.
- Q: How should the SC-U04 “contrast check documented” requirement be satisfied for dark and light themes? → A: **Manual documented spot-check** (body, muted, status cues) on Inbox + Planning × both themes; notes in verification-evidence (no formal WCAG tool required).
- Q: For a closed planning period, how strictly must frozen fields look non-editable? → A: **Read-only presentation** for frozen structure (non-focusable edit controls + clear closed cue); notes/history stay interactive per 003.

### Session 2026-10-20 (clarify)

- Q: When tray or global shortcut is not available, what should LocalStatus show the lead? → A: **Distinguish preview vs OS/registration failure** with a short reason text (not a flat “unavailable” for all cases).
- Q: What user-facing reason text should LocalStatus use for the two inactive cases? → A: **Fixed short phrases** — Preview: `Tray: n/a (browser preview)` / `Shortcut: n/a (browser preview)`; Tauri fail: `Shortcut: unavailable (registration failed)` (+ error detail when present); tray `unavailable (OS)` when not available in Tauri.
- Q: Should the Settings shortcut section also explain preview vs registration failure, or only LocalStatus? → A: **LocalStatus only** for FR-U14 phrases; Settings keeps a short Tauri-only note (no duplicate cause-class copy).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Coherent shell and navigation (Priority: P1)

An engineering lead opens LOS and sees a calm, consistent command-center shell: brand, primary navigation (Today / Inbox / Planning / Team / Reviews / Settings), offline/local status, and a content region that fits practical desktop window sizes. Navigation is keyboard-reachable and does not require learning a different pattern per page.

**Why this priority**: Without a shared shell, every later surface reinvents chrome and status.

**Independent Test**: Resize to a practical minimum window; Tab through nav; switch sections; confirm status region remains visible and routes map to existing durable workflows (no placeholder-only destinations).

**Acceptance Scenarios**:

1. **Given** LOS is open, **When** the lead views the shell, **Then** primary navigation exposes Today, Inbox, Planning, Team, Reviews, and Settings as coherent destinations backed by existing capabilities (see Assumptions for route mapping).
2. **Given** the lead is on Inbox, **When** they use the Inbox secondary link/sub-nav, **Then** Personal Actions (`ActionsPage`) opens without a seventh primary nav item.
3. **Given** the lead is on Team, **When** they use the section sub-nav, **Then** they can switch between Roster and Applications without leaving the Team primary destination.
4. **Given** the lead is on Reviews, **When** they use the section sub-nav, **Then** they can switch between Monthly Review and Planning history without leaving the Reviews primary destination.
5. **Given** keyboard-only use, **When** the lead moves focus through the shell, **Then** primary nav items, Inbox→Actions secondary entry, section sub-navs, and primary status are reachable without a pointer.
6. **Given** a practical desktop window size (documented minimum in plan), **When** the lead uses Inbox and Planning, **Then** essential controls remain usable without horizontal clipping of primary actions.

---

### User Story 2 - Design tokens and reusable components (Priority: P1)

The product applies shared design tokens (color, type, space, radius, semantic status) and a small set of reusable components (button, field, select, table/list row, banner, save indicator, empty state) so Inbox, Planning, and Reviews look and behave consistently in dark and light themes.

**Why this priority**: Visual consistency and information clarity depend on shared primitives.

**Independent Test**: Toggle theme; open Inbox and Capacity/Planning; confirm shared token-driven surfaces and status components (not one-off hex per page).

**Acceptance Scenarios**:

1. **Given** the design system is applied, **When** the lead switches between dark and light theme, **Then** core surfaces remain readable and semantic statuses remain distinguishable with non-color-only cues.
2. **Given** an error, empty list, or conflicted plan state, **When** those states appear, **Then** they use shared empty/error/conflict patterns with explicit text (not color alone).

---

### User Story 3 - Information-clear capacity planning surface (Priority: P1)

On the Planning / capacity surface, the lead sees an information hierarchy: period identity and plan status (open/closed/conflicted), capacity breakdown, demand list, load vs capacity, warnings, and close/history affordances—using progressive disclosure so essential decisions are visible first.

**Why this priority**: 003 math exists; 003 audit found UI hierarchy incomplete.

**Independent Test**: Open a period with unknown estimate and overload; confirm unknown and conflicted are explicit; confirm summary shows load/remain and unallocated/unestimated counts **when those data are available from services**.

**Acceptance Scenarios**:

1. **Given** a conflicted plan, **When** the lead views Planning, **Then** conflicted status is visible with text (and optional icon), not color alone, and remains after soft-gate acknowledgment.
2. **Given** an unestimated item, **When** it appears in demand, **Then** unknown effort is labeled distinctly from zero hours.
3. **Given** service data includes unallocated or unestimated counts, **When** the lead views the summary region, **Then** those counts are visible without opening advanced panels.
4. **Given** a 003 business field is not yet implemented in services/UI (e.g. dependency notes editor), **When** the lead uses Planning, **Then** the UI does not imply that field exists (no disabled fake controls that suggest broken features).
5. **Given** a closed planning period, **When** the lead views Planning, **Then** frozen structural fields use read-only presentation (non-focusable) with a clear closed cue; notes/history remain interactive only where 003 already permits.

---

### User Story 4 - Contextual editing and command palette (Priority: P2)

The lead can invoke a command palette (keyboard shortcut) to jump to Today, Inbox, Personal Actions, Planning, Team, Reviews, Settings, and Quick Capture, and can complete common navigational actions without hunting the sidebar.

**Why this priority**: Keyboard-first command center; secondary to shell/tokens.

**Independent Test**: Open palette via documented shortcut; filter “capacity”; activate; land on Planning.

**Acceptance Scenarios**:

1. **Given** LOS is focused, **When** the lead opens the command palette with the documented shortcut, **Then** they can filter and navigate to a primary destination without a pointer.
2. **Given** Quick Capture is available, **When** they choose Capture from the palette, **Then** the existing capture flow opens (tray/global shortcut behavior unchanged).

---

### User Story 5 - Honest persistence and system states (Priority: P1)

Across core surfaces, the lead sees loading, empty, offline/local, save pending/saved/failed, and error states that match actual persistence behavior. Consequential actions (close period, restore DB) remain confirmable.

**Why this priority**: Constitution VII/X honesty; 001 already has autosave—make patterns consistent.

**Independent Test**: Trigger validation error; observe banner; edit with autosave and see saved/pending; confirm Local status still reflects offline/local mode.

**Acceptance Scenarios**:

1. **Given** a durable save succeeds or fails, **When** the lead edited a core field with autosave or explicit save, **Then** the outcome is observable (saved / failed / pending) within the shared save-indicator pattern.
2. **Given** offline/local operation, **When** the lead views the shell, **Then** status continues to indicate local/offline-capable operation without requiring network.
3. **Given** an empty Inbox or empty demand list, **When** the lead views that surface, **Then** a shared empty state explains the next useful action.
4. **Given** tray or global shortcut is not active, **When** the lead views LocalStatus, **Then** the cue uses the FR-U14 canonical phrases: preview → `Tray: n/a (browser preview)` / `Shortcut: n/a (browser preview)`; Tauri registration failure → `Shortcut: unavailable (registration failed)` (append reported error when present); Tauri tray not available → `Tray: unavailable (OS)`.

---

### User Story 6 - Accessibility and desktop practicality (Priority: P2)

Primary workflows remain keyboard-operable; focus is visible; controls have accessible names. Default window size supports lead workflows; tray and global shortcut entry points remain available when the OS permits. When they are not active, LocalStatus explains **why** (preview vs OS/registration failure) so the lead does not mistake expected preview limits for a product defect.

**Why this priority**: Amends Desktop UX gate; builds on 001 FR-022/023 and 002 SC-H07 honesty.

**Independent Test**: Keyboard path for Inbox capture and Planning nav; verify focus ring; confirm tray/shortcut not removed in Tauri when registered; in Vite preview, LocalStatus shows preview-reason wording (not flat unavailable).

**Acceptance Scenarios**:

1. **Given** keyboard-only use, **When** the lead completes inbox capture and opens Planning, **Then** both succeed without a pointer.
2. **Given** focus moves among controls, **When** a control is focused, **Then** a visible focus indicator is present.
3. **Given** optional OS integrations fail (shortcut registration) in the Tauri shell, **When** the lead uses in-app capture, **Then** capture still works and LocalStatus shows an OS/registration failure reason (existing 002 behavior preserved, wording clarified).
4. **Given** LOS is running in browser/Vite preview (no Tauri), **When** the lead views LocalStatus, **Then** tray and shortcut lines read `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)`.

---

### Edge Cases

- Theme toggle mid-edit: no data loss; save indicator remains accurate.
- Closed planning period: frozen structure MUST use **read-only presentation** (non-focusable edit controls, muted/read-only styling, clear closed status cue)—not merely disabled-looking editable widgets. Notes and history disclosure MAY remain interactive when 003 already allows them.
- Narrow window: progressive disclosure collapses secondary panels before hiding conflict banners.
- Missing 003 fields: do not show placeholder inputs that post nowhere.
- Command palette with no match: empty result state, not a blank dialog.
- Tray/shortcut inactive in Vite preview: LocalStatus MUST show `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)`; MUST NOT imply the durable desktop shell failed.
- Tray/shortcut inactive in Tauri after OS deny or registration error: LocalStatus MUST show `Shortcut: unavailable (registration failed)` (optional `: {error}`) and/or `Tray: unavailable (OS)`; in-app capture MUST remain usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-U01**: LOS MUST provide a shared application shell with primary navigation destinations: Today, Inbox, Planning, Team, Reviews, Settings (mapping in Assumptions). Personal Actions MUST remain reachable as an Inbox secondary destination (sub-nav or section link), not as a seventh primary nav item. Team MUST expose in-section sub-nav/tabs for Roster and Applications. Reviews MUST expose in-section sub-nav/tabs for Monthly Review and Planning history.
- **FR-U02**: LOS MUST apply shared design tokens for color (including dark graphite default and light theme), typography, spacing, and semantic status (ok, warning, danger, unknown, conflicted, muted).
- **FR-U03**: LOS MUST provide reusable UI primitives for button, text field, select, list/table row, banner/callout, save indicator, and empty state used by Inbox, Planning, and at least one Reviews surface.
- **FR-U04**: Decision-critical statuses (unknown estimate, conflicted plan, offline/degraded, save failed, validation error) MUST include a non-color-only cue.
- **FR-U05**: Planning/capacity MUST show period identity, open/closed status, conflicted state when present, per-member capacity inputs already supported, load vs remain, and warning list; MUST show unallocated and unestimated counts when returned by services. When the period is closed, frozen structural fields MUST use read-only presentation (non-focusable edit controls + clear closed cue); notes/history MAY remain interactive per 003 freeze rules.
- **FR-U06**: Progressive disclosure MUST keep conflict/error banners visible while allowing secondary detail (e.g. raw history payload, advanced notes) to be collapsed.
- **FR-U07**: LOS MUST offer a command palette reachable by keyboard for navigation to primary destinations, Personal Actions, and Quick Capture.
- **FR-U08**: Save pending/saved/failed patterns MUST be consistent on autosave surfaces (Daily/Fortnight/Monthly and Planning notes where autosave or explicit save applies).
- **FR-U09**: Primary capture, navigation, and Planning entry MUST be keyboard-operable; focused controls MUST show a visible focus indicator.
- **FR-U10**: This feature MUST NOT require Jira, Confluence, an LLM, an account, or a cloud backend.
- **FR-U11**: This feature MUST NOT weaken or silently alter 001–003 domain rules, SQLite schema contracts, or soft-gate/freeze/carry-forward behavior.
- **FR-U12**: Missing 003 business capabilities (fields not exposed by services or not yet implemented) MUST NOT be faked in the UI; gaps MUST be tracked as 003 follow-ups, not marked complete by restyle alone.
- **FR-U13**: Practical default and minimum window sizes for the desktop shell MUST be documented and verified for Inbox + Planning primary actions.
- **FR-U14**: LocalStatus (or equivalent shell status) MUST distinguish tray/global-shortcut inactivity causes with short non-color-only reason text. Canonical visible phrases: (a) **preview** (not Tauri): `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)`; (b) **Tauri registration failed / denied**: `Shortcut: unavailable (registration failed)` and MAY append the reported error; (c) **Tauri tray not available**: `Tray: unavailable (OS)`. Flat undifferentiated “unavailable” for both preview and Tauri failure is forbidden. In-app capture MUST remain usable in all of these cases (aligned with 001 FR-021 / 002 FR-H09). Settings MUST NOT duplicate these FR-U14 phrases; Settings MAY keep a short note that OS shortcut registration applies in the Tauri desktop shell only.

### Key Entities (presentation-level)

- **Design Token Set**: Named variables for theme, type, space, status.
- **Shell Route**: Named destination with label, keyboard target, backing feature.
- **Command Palette Action**: Navigational or capture action with id, label, shortcut hint.
- **Surface State**: loading | empty | ready | error | offline/degraded | conflicted (as applicable).
- **Capability Status Cue**: Tray/shortcut presentation state with cause class `preview` | `os-unavailable` | `registration-failed` | `available` and short reason text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-U01**: In a scripted keyboard-only path, a lead can open Inbox, capture an item, and navigate to Planning without a pointer, in 100% of verification trials (minimum 3).
- **SC-U02**: With a conflicted capacity plan fixture, conflicted status remains visible with text after soft-gate acknowledgment, in 100% of scripted UI checks.
- **SC-U03**: Unknown estimate fixtures render a distinct “unknown” (or equivalent) label and never display as `0` hours, in 100% of scripted UI checks.
- **SC-U04**: Theme toggle dark↔light leaves Inbox and Planning readable via a **manual documented spot-check** of body text, muted text, and danger/warning/unknown/conflicted status cues on both themes (notes in verification-evidence; no formal WCAG audit tool required), and does not clear in-memory draft fields mid-edit, in 100% of trials (minimum 3).
- **SC-U05**: Command palette opens via documented shortcut and navigates to Planning in under 5 seconds in a timed dry-run.
- **SC-U06**: No Jira/Confluence/LLM dependency is required for any acceptance scenario in this feature.
- **SC-U07**: Existing 001 inbox capture and 003 capacity calculation unit tests remain green after UX changes (no domain regressions).
- **SC-U08**: In Vite/browser preview, LocalStatus shows exactly `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)` in 100% of scripted checks (minimum 1). In Tauri with failed/denied shortcut registration, LocalStatus shows `Shortcut: unavailable (registration failed)` (error detail optional) while in-app capture still succeeds (maps to 002 SC-H07 with clearer copy).

## Assumptions

- **Route mapping (no fake modules)**:
  - **Today** → Daily Review (existing).
  - **Inbox** → Inbox (+ Quick Capture entry); **Personal Actions** via Inbox secondary sub-nav/section link to `ActionsPage` (not a primary nav item).
  - **Planning** → Capacity planning (003) primary; personal Fortnight plan linked/secondary as disclosure or sub-nav.
  - **Team** → In-section sub-nav/tabs: **Roster** (capacity team members) \| **Applications** (existing four slots)—not multi-user auth.
  - **Reviews** (formerly referred to as "Reviews/History") → In-section sub-nav/tabs: **Monthly** Review \| **Planning history** (closed-period snapshot access). Planning may still show history disclosure for the active period; Reviews is the dedicated history entry.
  - **Settings** → existing Settings (shortcut, backup/restore, weekday).
- No MUI/Tailwind today; **reuse React + CSS variables**; introducing a new UI framework requires an ADR and is out of default scope.
- Visual direction (graphite dark / polished light, typography, spacing) is specified in plan/tokens, not the constitution.
- 003 incomplete UI fields (priority, application target, dependency notes, actual hours editors, etc.) are **003 functional follow-ups**; 004 may add layout slots only when service APIs already expose data, otherwise omit.
- Soft-gate and freeze rules remain owned by 003 domain/app-services; 004 only presents them honestly.
- Jira/LLM remain optional/absent.
- **Governance**: Spec approval unlocks UI implementation; constitution v1.1.0 (or written time-bounded exception) is required before calling the feature complete.
- **Tray/shortcut status honesty**: Preview (non-Tauri) vs OS/registration failure (Tauri) MUST use the FR-U14 canonical phrases in LocalStatus; do not substitute bare “unavailable” for preview. Settings is not the owner of those phrases (short Tauri-only note allowed).

## Out of Scope

- Implementing missing 003 business fields solely to fill the new layout (track under 003)
- New UI framework adoption (MUI/Tailwind/etc.) without ADR
- Redesigning domain schema or capacity formulas
- Mandatory cloud sync, accounts, or telemetry
- Full accessibility audit certification (WCAG formal); this feature requires keyboard + names + non-color-only status
- Placeholder screens for future unspec’d products (OKRs, hiring, etc.)

## Dependencies

| Dependency | Impact |
|------------|--------|
| Constitution amendment (proposed 1.1.0) | Gate for **feature complete** / Desktop UX honesty “done”—not a hard block on starting UI code after this spec is approved |
| 003 services (`planning.periodGet` totals, warnings, freeze) | Required for SC-U02/U03 presentation |
| 003 P1 audit gaps | Soft-gate blind spot & missing fields are **not** closed by 004 alone |
| 001 autosave / LocalStatus | Reuse patterns; do not fork status systems |
