# Tasks: Lead Command Center UX & Design System

**Input**: Design documents from `/specs/004-lead-command-ux/`  
**Prerequisites**: plan.md (FR-U14 refresh), spec.md (clarify 2026-10-19 + 2026-10-20), research.md (R8/R9), data-model.md, contracts/ui-shell.md, quickstart.md  
**Git branch**: `feature/005-lead-command-ux` | **Feature dir**: `specs/004-lead-command-ux`  
**Governance**: Constitution v1.1.0 applied. Feature **complete** requires Desktop UX verification evidence (incl. SC-U08).  
**Rule**: Never mark `[X]` without a verification-evidence row  
**Baseline**: Do not change 001–003 domain rules, SQLite contracts, soft-gate/freeze/carry-forward; do not fake missing 003 fields (FR-U12). Minimalism MUST NOT hide Banner/StatusCue/SaveIndicator text (R8). LocalStatus MUST NOT use bare “unavailable” for Vite preview (FR-U14).

**Tests**: Scripted UI verification + domain regression (`pnpm test`); SC-U04 contrast spot-check; SC-U08 Vite LocalStatus phrase check. No TDD suite required.

**Status**: Phases 1–21 complete (T001–T103). Shortcut registration convergence landed.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup (Shared Infrastructure) — DONE

**Purpose**: Evidence stub, folders, tokens entry, window sizing

- [x] T001 Record constitution complete-gate status in `specs/004-lead-command-ux/checklists/verification-evidence.md`: either apply v1.1.0 to `.specify/memory/constitution.md` via `/speckit-constitution`, or note written time-bounded exception — **does not block coding after spec approval**; **blocks feature complete**
- [x] T002 Create `specs/004-lead-command-ux/checklists/verification-evidence.md` stub with rows for SC-U01–U07 (incl. SC-U04 contrast columns), FR-U13, closed read-only, constitution complete-gate, 003 Track B follow-ups
- [x] T003 Create dirs `apps/desktop/src/styles/`, `apps/desktop/src/ui/`, `apps/desktop/src/shell/` per plan.md
- [x] T004 Create `apps/desktop/src/styles/tokens.css` with `theme` `"dark" | "light"` (default dark graphite), color/type/space/radius tokens, and semantic status `--status-ok`, `--status-warning`, `--status-danger`, `--status-unknown`, `--status-conflicted`, `--status-muted`
- [x] T005 [P] Create `apps/desktop/src/styles/base.css` with shared form resets and visible `:focus-visible` rings; import tokens+base from `apps/desktop/src/main.tsx` and/or slim `apps/desktop/src/styles.css`
- [x] T006 [P] Set Tauri default ≥1200×800 and practical minimum ≥1024×680 in `apps/desktop/src-tauri/tauri.conf.json` (`minWidth`/`minHeight` if supported; else document fallback); document in `apps/desktop/README.md` (FR-U13)

---

## Phase 2: Foundational (Blocking Prerequisites) — DONE

**Purpose**: Theme helper + shared primitives  

**⚠️ CRITICAL**: No user story UI work until this phase completes

- [x] T007 Add `apps/desktop/src/ui/theme.ts` — read/write `localStorage` key `los.ui.theme` (`"dark" | "light"` only); apply `document.documentElement.dataset.theme`; early read from `apps/desktop/src/main.tsx`
- [x] T008 Add `apps/desktop/src/ui/Button.tsx` (primary/danger/ghost) using tokens
- [x] T009 [P] Add `apps/desktop/src/ui/Field.tsx` with accessible name (label associated to control)
- [x] T010 [P] Add `apps/desktop/src/ui/Select.tsx` with accessible name — adopt on ≥1 real control in US2 restyles (not orphan primitive)
- [x] T011 [P] Add `apps/desktop/src/ui/Banner.tsx` (error/warning/info) — text + optional icon; never color-only (FR-U04)
- [x] T012 [P] Add `apps/desktop/src/ui/SaveIndicator.tsx` with `status` `'idle' | 'pending' | 'saved' | 'failed'` and optional `message`
- [x] T013 [P] Add `apps/desktop/src/ui/EmptyState.tsx` (title + next useful action)
- [x] T014 [P] Add `apps/desktop/src/ui/Row.tsx` list/table row primitive (FR-U03)
- [x] T015 Add `apps/desktop/src/ui/StatusCue.tsx` for unknown/conflicted/offline/degraded with mandatory text cue (canonical name: StatusCue, not StatusPill)
- [x] T016 [P] Add `apps/desktop/src/shell/SectionSubNav.tsx` reusable in-section tabs/links pattern for Inbox secondary, Team, Reviews, Planning fortnight

**Checkpoint**: Foundation ready

---

## Phase 3: User Story 1 — Coherent shell and navigation (Priority: P1) 🎯 MVP — DONE

**Goal**: Six primary destinations + Inbox→Actions secondary + Team/Reviews section sub-nav  
**Independent Test**: Tab through primary nav and section sub-navs; Actions via Inbox; no seventh primary Actions item; LocalStatus visible

### Implementation

- [x] T017 [US1] Extract `apps/desktop/src/shell/routes.ts` with primary ids + secondary ids per `contracts/ui-shell.md` (`actions`, `team-roster`, `team-apps`, `reviews-monthly`, `reviews-history`, `planning-fortnight`)
- [x] T018 [US1] Implement `apps/desktop/src/shell/Nav.tsx` — primary six destinations keyboard-reachable (Tab)
- [x] T019 [US1] Implement `apps/desktop/src/shell/AppShell.tsx`; refactor `apps/desktop/src/App.tsx` to use shell + route state
- [x] T020 [US1] Wire Inbox primary → `InboxPage`; Inbox secondary sub-nav → `ActionsPage` via `SectionSubNav` (FR-U01; not a primary nav item)
- [x] T021 [US1] Wire Team section sub-nav Roster \| Applications in shell/Team host (roster from capacity members UI + `ApplicationsPage`)
- [x] T022 [US1] Wire Reviews section sub-nav Monthly \| Planning history (`MonthlyReviewPage` + closed-period history entry)
- [x] T023 [US1] Wire Today→`DailyReviewPage`, Planning→`CapacityPlanPage` + Fortnight secondary, Settings→`SettingsPage`
- [x] T024 [US1] Keep `LocalStatus` in shell chrome (FR-U01)
- [x] T025 [US1] Record shell/nav + Inbox→Actions + Team/Reviews sub-nav keyboard smoke in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: All destinations open existing durable pages; Actions not in primary nav

---

## Phase 4: User Story 2 — Design tokens and reusable components (Priority: P1) — DONE

**Goal**: Shared tokens/primitives on Inbox, Planning, ≥1 Reviews; theme toggle; Select used once  
**Independent Test**: Theme toggle; shared Banner/Empty; SC-U04 manual contrast notes

### Implementation

- [x] T026 [US2] Add theme toggle in `apps/desktop/src/features/settings/SettingsPage.tsx` using `apps/desktop/src/ui/theme.ts` (`localStorage` only)
- [x] T027 [US2] Restyle `apps/desktop/src/features/inbox/InboxPage.tsx` + `QuickCapture.tsx` to Field/Button/Select/Row/EmptyState/Banner/SaveIndicator (include ≥1 `Select` usage)
- [x] T028 [P] [US2] Restyle `apps/desktop/src/features/actions/ActionsPage.tsx` to shared primitives (Inbox secondary surface)
- [x] T029 [P] [US2] Restyle at least one Reviews surface (`MonthlyReviewPage.tsx`) to shared primitives
- [x] T030 [US2] Apply token-driven chrome to `CapacityPlanPage.tsx` surfaces (full hierarchy is US3)
- [x] T031 [US2] Record SC-U04 in verification-evidence.md: ≥3 theme toggle trials (no draft loss) + **manual contrast spot-check** notes for body, muted, and status cues on Inbox + Planning × dark and light (no WCAG tool required)

**Checkpoint**: Theme + shared primitives on Inbox/Planning/Actions

---

## Phase 5: User Story 3 — Information-clear capacity planning surface (Priority: P1) — DONE

**Goal**: Planning hierarchy; unknown/conflicted honesty; closed read-only presentation; no fake 003 editors  
**Independent Test**: SC-U02/U03; closed period non-focusable frozen fields; API totals when present

### Implementation

- [x] T032 [US3] Refactor `apps/desktop/src/features/planning/CapacityPlanPage.tsx` layout: period identity + open/closed + conflicted StatusCue; capacity summary (load vs remain); demand; warnings via Banner; progressive disclosure for secondary history/notes (FR-U05/U06)
- [x] T033 [US3] Surface unallocatedCount + unestimatedCommitCount from `planning.periodGet` / `capacitySummary.totals` in summary region of `CapacityPlanPage.tsx` when present (FR-U05)
- [x] T034 [US3] Label unknown estimates via `StatusCue` in `CapacityPlanPage.tsx`; never display as `0` hours (SC-U03)
- [x] T035 [US3] Keep conflicted status visible with text after soft-gate acknowledgment in `CapacityPlanPage.tsx` (SC-U02)
- [x] T036 [US3] Closed period: read-only presentation for frozen structure in `CapacityPlanPage.tsx` — non-focusable edit controls, muted/read-only styling, clear closed cue; notes/history interactive only per 003 (FR-U05 / clarify)
- [x] T037 [US3] **Omit** unimplemented 003 field editors in `CapacityPlanPage.tsx` (priority, application target, dependency notes, actual hours); note Track B in verification-evidence.md (FR-U12)
- [x] T038 [US3] Record SC-U02/U03 + closed read-only smoke in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Restyle does not claim 003 FR-C05/C09/C12 complete

---

## Phase 6: User Story 5 — Honest persistence and system states (Priority: P1) — DONE

**Goal**: Shared save/empty/error/offline patterns; keep consequential confirms  
**Independent Test**: SaveIndicator on autosave; EmptyState; Local status; close/restore still confirmable

### Implementation

- [x] T039 [US5] Wire `SaveIndicator` into `DailyReviewPage.tsx`, `FortnightPlanPage.tsx`, `MonthlyReviewPage.tsx` via `apps/desktop/src/lib/autosave.ts` (FR-U08)
- [x] T040 [US5] Wire `SaveIndicator` / `Banner` into Planning notes / explicit save in `CapacityPlanPage.tsx`
- [x] T041 [US5] Shared `EmptyState` on `InboxPage.tsx` open list and `CapacityPlanPage.tsx` empty demand
- [x] T042 [US5] Map SurfaceState cues on `InboxPage.tsx` + `CapacityPlanPage.tsx` using Banner/StatusCue (text for decision-critical states)
- [x] T043 [US5] Verify close-period and Settings restore still use confirmable dialogs after restyle; record in verification-evidence.md
- [x] T044 [US5] Record save/empty/error/local-status smoke in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: One save-indicator pattern across autosave surfaces

---

## Phase 7: User Story 4 — Contextual editing and command palette (Priority: P2) — DONE

**Goal**: Meta/Ctrl+K palette including Personal Actions  
**Independent Test**: SC-U05; empty filter → EmptyState

### Implementation

- [x] T045 [P] [US4] Implement `apps/desktop/src/shell/CommandPalette.tsx` with `PaletteAction` per `contracts/ui-shell.md`
- [x] T046 [US4] Register `Meta+K` / `Ctrl+K` + Escape in `apps/desktop/src/shell/AppShell.tsx`; do not break global capture shortcut / tray Quick Capture
- [x] T047 [US4] Wire palette actions for Today, Inbox, **Actions**, Planning, Team, Reviews, Settings, Quick Capture in `CommandPalette.tsx` + `routes.ts`; empty filter → `EmptyState`
- [x] T048 [US4] Record SC-U05 timed palette→Planning dry-run in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Keyboard jump to Planning and Actions without sidebar hunting

---

## Phase 8: User Story 6 — Accessibility and desktop practicality (Priority: P2) — DONE

**Goal**: Keyboard SC-U01, focus rings, names, window sizes, shortcut degrade  
**Independent Test**: SC-U01 ×3; FR-U13 at minimum size

### Implementation

- [x] T049 [US6] Audit accessible names on `AppShell.tsx`, `Nav.tsx`, `SectionSubNav.tsx`, `InboxPage.tsx`, `ActionsPage.tsx`, `CapacityPlanPage.tsx`; fix gaps
- [x] T050 [US6] Verify focus-visible rings from `apps/desktop/src/styles/base.css` on nav, section sub-nav, fields, buttons, palette items
- [x] T051 [US6] Verify window default/min in `apps/desktop/src-tauri/tauri.conf.json` against T006; progressive disclosure in `CapacityPlanPage.tsx` collapses secondary before conflict banners (FR-U13)
- [x] T052 [US6] Confirm shortcut-deny still allows in-app capture; record in verification-evidence.md
- [x] T053 [US6] Record SC-U01 keyboard Inbox capture → Planning ×3 in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Desktop practicality documented

---

## Phase 9: Polish & Cross-Cutting Concerns — DONE (pre-minimalism)

- [x] T054 [P] Align `specs/004-lead-command-ux/quickstart.md` with nav labels, Inbox→Actions, Team/Reviews sub-nav, shortcuts, window sizes, contrast method
- [x] T055 [P] Align `specs/004-lead-command-ux/plan.md` clarification→design mapping with post-clarify decisions (Actions secondary, section sub-nav, governance B, closed read-only, contrast B)
- [x] T056 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` (+ `cargo check` in `apps/desktop/src-tauri` if used); paste into verification-evidence.md (SC-U06/U07)
- [x] T057 Honesty pass: 003 Track B listed in verification-evidence.md; do **not** mark FR-C05/C09/C12 done by restyle (FR-U11/U12)
- [x] T058 Final constitution Desktop UX gate evidenced in verification-evidence.md (applied v1.1.0 or exception from T001) — required for feature **complete**

---

## Phase 10: Modern Minimalism Foundation (Blocking for polish stories)

**Purpose**: Density tokens, quiet background, shared list/row chrome, motion tokens per research R8 / contracts visual-density  
**⚠️ CRITICAL**: Complete before Phases 11–16 polish story work

- [x] T059 Add density tokens to `apps/desktop/src/styles/tokens.css`: `--sidebar-width` (~200px), `--content-max`, `--motion-fast` (≤200ms), keep `theme` `"dark" | "light"` (default `"dark"`) and existing semantic status tokens
- [x] T060 Quiet page background in `apps/desktop/src/styles/base.css` — soft single-plane or very low-contrast atmosphere; tone down large accent radial wash so content leads (R8); no purple/glow aesthetic
- [x] T061 Replace stacked bordered-card list chrome in `apps/desktop/src/styles/base.css` (`.list li`, `.card` defaults) with hairline dividers / spacing for passive lists; reserve elevated `--bg-elevated` panels for interactive clusters only (forms, palette, confirms)
- [x] T062 [P] Add short motion utilities in `apps/desktop/src/styles/base.css` for palette/theme/route transitions using `--motion-fast` only (no decorative loops)

**Checkpoint**: Tokens + base chrome ready for surface polish

---

## Phase 11: User Story 1 — Slim shell chrome (Priority: P1) 🎯 MVP polish

**Goal**: Calm minimal shell — slim sidebar, quiet brand, LocalStatus as footer text (not a status dashboard)  
**Independent Test**: Shell shows six primary nav items + LocalStatus; no stat strips/promo chrome; keyboard Tab still reaches nav

### Implementation

- [x] T063 [US1] Slim `apps/desktop/src/shell/AppShell.tsx` + `.app-shell`/`.sidebar`/`.brand` in `apps/desktop/src/styles/base.css` to ~`--sidebar-width`; quiet brand (LOS + one short local-first line); LocalStatus footer only — no dashboard widgets
- [x] T064 [US1] Quiet active/hover styles for `apps/desktop/src/shell/Nav.tsx` and `apps/desktop/src/shell/SectionSubNav.tsx` (accent for focus/active only; no glow rings or pill clusters)
- [x] T065 [US1] Record slim-shell smoke (no seventh primary Actions; LocalStatus visible) in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Shell reads modern/minimal without IA changes

---

## Phase 12: User Story 2 — Quiet tokens on core surfaces (Priority: P1)

**Goal**: One title + short lede; reducer card chrome on Inbox/Actions/Reviews; theme remains readable  
**Independent Test**: Theme toggle; Inbox/Planning first viewport has one h1 + lede; lists use dividers more than stacked cards

### Implementation

- [x] T066 [US2] Apply SurfaceLayout (one `h1` + optional one-line lede; essential region first) to `apps/desktop/src/features/inbox/InboxPage.tsx` and `apps/desktop/src/features/inbox/QuickCapture.tsx` without removing Banner/SaveIndicator/EmptyState
- [x] T067 [P] [US2] Apply SurfaceLayout + divider list chrome to `apps/desktop/src/features/actions/ActionsPage.tsx`
- [x] T068 [P] [US2] Apply SurfaceLayout + quieter chrome to `apps/desktop/src/features/reviews/MonthlyReviewPage.tsx` (and `ReviewsPage.tsx` host if needed)
- [x] T069 [US2] Align `apps/desktop/src/ui/Row.tsx` / list consumers with divider-first chrome (no decorative multi-layer shadows)
- [x] T070 [US2] Re-run SC-U04 manual contrast spot-check after token/background changes; update notes in `specs/004-lead-command-ux/checklists/verification-evidence.md` for body, muted, status cues on Inbox + Planning × dark and light

**Checkpoint**: Shared primitives still used; surfaces quieter

---

## Phase 13: User Story 3 — Planning hierarchy, minimal density (Priority: P1)

**Goal**: Keep period/status/summary/demand honesty; compact summary; progressive disclosure for secondary; no fake 003 fields  
**Independent Test**: SC-U02/U03 still hold; conflict banner visible; summary not a global chrome widget

### Implementation

- [x] T071 [US3] Compact Planning first viewport in `apps/desktop/src/features/planning/CapacityPlanPage.tsx`: period identity + open/closed + conflicted StatusCue; load/remain + unallocated/unestimated when present; demand; warnings via Banner — secondary history/notes collapsed (FR-U05/U06)
- [x] T072 [US3] Restyle Planning summary strip / demand rows in `CapacityPlanPage.tsx` + related `base.css` classes (`.summary-strip`, `.period-header`) toward divider/spacing chrome without removing text status cues
- [x] T073 [US3] Honesty floor check: closed read-only, unknown ≠ `0`, conflicted text after soft-gate; still omit unimplemented 003 editors (FR-U12); note in verification-evidence.md

**Checkpoint**: Planning remains decision-clear and visually quieter

---

## Phase 14: User Story 5 — Flow clarity + honest states (Priority: P1)

**Goal**: Empty states name exactly one next action; Settings without card grids; saves/errors still observable  
**Independent Test**: Empty Inbox/demand → one CTA; SaveIndicator still visible; close/restore still confirmable

### Implementation

- [x] T074 [US5] Ensure `apps/desktop/src/ui/EmptyState.tsx` consumers on `InboxPage.tsx` and `CapacityPlanPage.tsx` name exactly one primary next action (contracts UX flow)
- [x] T075 [US5] Restyle `apps/desktop/src/features/settings/SettingsPage.tsx` as grouped prefs with spacing/dividers — no card-grid chrome; keep theme toggle + confirmable restore
- [x] T076 [P] [US5] Apply SurfaceLayout (one title + lede) to `apps/desktop/src/features/reviews/DailyReviewPage.tsx` and `apps/desktop/src/features/reviews/FortnightPlanPage.tsx` without dropping SaveIndicator
- [x] T077 [US5] Record empty/save/settings-minimal smoke in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Flows clearer; honesty preserved

---

## Phase 15: User Story 4 — Quiet palette motion (Priority: P2)

**Goal**: Short palette open/close motion; keep SC-U05 and empty-filter EmptyState  
**Independent Test**: Meta/Ctrl+K → Planning under 5s; motion ≤ `--motion-fast`; Escape closes

### Implementation

- [x] T078 [US4] Apply quiet open/close motion to `apps/desktop/src/shell/CommandPalette.tsx` + `.palette-backdrop`/`.palette-panel` in `apps/desktop/src/styles/base.css` using `--motion-fast`; remove heavy multi-layer shadow if present; keep elevated panel for interaction
- [x] T079 [US4] Optional ≤200ms route content fade in `apps/desktop/src/App.tsx` or `apps/desktop/src/shell/AppShell.tsx` main region only — no decorative animation noise
- [x] T080 [US4] Re-time SC-U05 palette→Planning dry-run; record in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Palette remains keyboard-first and calm

---

## Phase 16: User Story 6 — A11y after polish (Priority: P2)

**Goal**: Focus rings, names, keyboard SC-U01, window mins still hold after chrome changes  
**Independent Test**: SC-U01 ×3; focus-visible on nav/fields/palette; FR-U13 at minimum size

### Implementation

- [x] T081 [US6] Re-verify `:focus-visible` rings and accessible names on `AppShell.tsx`, `Nav.tsx`, `SectionSubNav.tsx`, `InboxPage.tsx`, `CapacityPlanPage.tsx`, `CommandPalette.tsx` after minimal chrome changes; fix gaps in those files / `base.css`
- [x] T082 [US6] Confirm progressive disclosure still collapses secondary before conflict banners at min window in `CapacityPlanPage.tsx`; re-check `tauri.conf.json` mins (FR-U13)
- [x] T083 [US6] Record SC-U01 keyboard Inbox capture → Planning ×3 after polish in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Desktop UX gate still satisfied post-minimalism

---

## Phase 17: Polish & Cross-Cutting (modern minimal)

**Purpose**: Docs, regression, honesty, complete-gate evidence for R8 pass

- [x] T084 [P] Align `specs/004-lead-command-ux/quickstart.md` check #11 (modern minimal) with implemented chrome; fix any drift
- [x] T085 [P] Confirm `specs/004-lead-command-ux/contracts/ui-shell.md` visual/density + UX flow sections match shipped behavior
- [x] T086 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` (+ `cargo check` in `apps/desktop/src-tauri` if used); paste into verification-evidence.md (SC-U06/U07)
- [x] T087 Honesty pass: conflict/error/unknown/save/closed cues still text-visible after minimalism; 003 Track B still listed; do **not** mark FR-C05/C09/C12 done (FR-U11/U12)
- [x] T088 Record modern-minimal smoke + Desktop UX complete-gate refresh in `specs/004-lead-command-ux/checklists/verification-evidence.md`

---

## Phase 18: Foundational — Capability phrase helper (FR-U14)

**Purpose**: Shared cause→label mapping per research R9 / `CapabilityStatusCue`  
**⚠️ CRITICAL**: Complete before US5/US6 LocalStatus wiring

- [x] T089 Add `apps/desktop/src/features/status/capabilityPhrases.ts` exporting cause class `'preview' | 'os-unavailable' | 'registration-failed' | 'available'` and exact FR-U14 strings: preview `Tray: n/a (browser preview)` / `Shortcut: n/a (browser preview)`; Tauri tray `Tray: unavailable (OS)`; Tauri shortcut fail `Shortcut: unavailable (registration failed)` (optional error suffix); ok `Tray: available` / `Shortcut: registered`
- [x] T090 Document detection rule in `capabilityPhrases.ts` (or adjacent comment): **preview** when not Tauri (`!window.__TAURI__`); else use workspace flags `trayAvailable`, `globalShortcutAvailable`, `globalShortcutRegistered`, `globalShortcutError`

**Checkpoint**: Pure phrase helper ready (no UI yet)

---

## Phase 19: User Story 5 — Honest LocalStatus capability cues (Priority: P1) 🎯 MVP

**Goal**: LocalStatus distinguishes Vite preview vs Tauri OS/registration failure with FR-U14 phrases  
**Independent Test**: Vite preview shows exact `n/a (browser preview)` lines; bare `unavailable` absent for preview

### Implementation

- [x] T091 [US5] Wire `apps/desktop/src/features/status/LocalStatus.tsx` to `capabilityPhrases.ts` using runtime Tauri detection + existing `api.workspaceStatus` flags; render canonical tray/shortcut lines (FR-U14)
- [x] T092 [US5] Ensure Settings does **not** duplicate FR-U14 phrases in `apps/desktop/src/features/settings/SettingsPage.tsx`; keep/add only a short Tauri-only note under Shortcuts if missing (clarify B)
- [x] T093 [US5] Record SC-U08 Vite preview LocalStatus phrase smoke in `specs/004-lead-command-ux/checklists/verification-evidence.md` (exact `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)`)

**Checkpoint**: Preview no longer looks like a broken desktop shell

---

## Phase 20: User Story 6 — Tauri degrade path + polish (Priority: P2)

**Goal**: Tauri registration-fail / OS-unavailable wording; in-app capture still works; docs aligned  
**Independent Test**: Tauri fail shows `Shortcut: unavailable (registration failed)` (+ optional error); Inbox capture still succeeds

### Implementation

- [x] T094 [US6] Verify Tauri path in `LocalStatus.tsx`: when `globalShortcutAvailable` but not registered (or `globalShortcutError` set), show `Shortcut: unavailable (registration failed)` with optional error detail; when tray false in Tauri show `Tray: unavailable (OS)`; when registered/available show ok phrases
- [x] T095 [US6] Confirm in-app Inbox capture still works when shortcut unavailable (002 SC-H07); note in verification-evidence.md
- [x] T096 [P] Align `specs/004-lead-command-ux/quickstart.md` check #12 and `contracts/ui-shell.md` LocalStatus section with shipped phrases
- [x] T097 Run `pnpm lint && pnpm --filter @los/desktop build` (+ domain/persistence unit tests); paste into verification-evidence.md
- [x] T098 Record FR-U14 / SC-U08 complete-gate row in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Capability honesty complete for preview and Tauri

---

## Dependencies & Execution Order

### Phase Dependencies

- Phases 1–17 (T001–T088): **complete**
- Phase 18 (T089–T090): blocks Phase 19–20
- Phase 19 (US5 LocalStatus): MVP for FR-U14
- Phase 20 (US6 Tauri + docs): after Phase 19

### User Story Dependencies (remaining)

| Story | Depends on |
|-------|------------|
| US5 LocalStatus phrases | Phase 18 helper |
| US6 Tauri degrade + evidence | Phase 19 |

### Parallel Opportunities (remaining)

- T092 ∥ T091 after T089 (different files)  
- T096 ∥ T095 after T094  

### Parallel Example: Phase 19

```bash
Task: "Wire LocalStatus.tsx to capabilityPhrases.ts"
Task: "Ensure SettingsPage.tsx has Tauri-only note without FR-U14 duplicates"
```

---

## Implementation Strategy

### MVP (remaining)

Phase 18 + Phase 19 (T089–T093) — Vite preview honesty (SC-U08).

### Incremental

1. Phrase helper (T089–T090)  
2. LocalStatus + Settings note + SC-U08 evidence (T091–T093)  
3. Tauri fail path + docs + regression (T094–T098)  

---

## Requirement Traceability

| Requirement / SC | Tasks (original) | Tasks (minimal polish) | Tasks (FR-U14) |
|------------------|------------------|------------------------|----------------|
| FR-U01 shell | T016–T025 | T063–T065 | — |
| FR-U02 tokens | T004–T005, T007, T026 | T059–T060, T070 | — |
| FR-U03 primitives | T008–T015, T027–T030 | T069 | — |
| FR-U04 non-color status | T011, T015, T034–T035, T042 | T073, T087 | T091 |
| FR-U05 Planning + closed | T032–T038 | T071–T073 | — |
| FR-U06 progressive disclosure | T032, T051 | T071, T082 | — |
| FR-U07 palette | T045–T048 | T078–T080 | — |
| FR-U08 save patterns | T012, T039–T044 | T074, T076–T077 | — |
| FR-U09 keyboard + focus | T005, T018, T049–T053 | T081, T083 | — |
| FR-U10–U12 | T037, T056–T057 | T073, T086–T087 | — |
| FR-U13 window sizes | T006, T051 | T082 | — |
| FR-U14 capability phrases | — | — | T089–T098 |
| SC-U01 | T053 | T083 | — |
| SC-U02–U03 | T034–T035, T038 | T073 | — |
| SC-U04 | T031 | T070 | — |
| SC-U05 | T048 | T080 | — |
| SC-U06–U07 | T056 | T086 | T097 |
| SC-U08 preview phrases | — | — | T093, T098 |
| Modern minimal (R8) | — | T059–T088 | — |
| Constitution complete-gate | T001, T058 | T088 | T098 |

---

## Notes

- Track B (003) remains out of 004 implementation  
- Do not reopen T001–T088 checkboxes; only mark T089+ as completed with evidence  
- Format: all tasks use `- [ ] Tnnn [P?] [USn?] …` with file paths (open) or `- [x]` (done)  
- Next: `/speckit-git-commit` then optional PR to develop for FR-U14

---

## Phase 21: Convergence

- [x] T099 Fix double global-shortcut registration in `apps/desktop/src-tauri/src/shortcuts.rs`: `on_shortcut(...)` already registers the hotkey, so remove the redundant second `.register(shortcut)` call and treat a successful `on_shortcut` as `registered=true` with cleared error, so `los:caps` and `ShortcutStateMutex` no longer report a spurious failure per FR-U14 (contradicts)
- [x] T100 Fix accelerator modifier parsing in `apps/desktop/src-tauri/src/shortcuts.rs` `parse_accel`: parse `+`-separated tokens instead of substring matching so `CommandOrControl+Shift+L` yields exactly one of SUPER (macOS) or CONTROL plus SHIFT — not SUPER+CONTROL+SHIFT — and add unit tests covering `CommandOrControl+Shift+L`, `Cmd+Shift+L`, and `Ctrl+Shift+L` per FR-U14 (partial)
- [x] T101 Make LocalStatus reflect actual Rust shortcut state in `apps/desktop/src/lib/runtime.ts`, `apps/desktop/src/App.tsx`, and `apps/desktop/src/features/status/LocalStatus.tsx`: invoke the Rust `workspace_status` command at boot (and refresh it when Settings re-registers) instead of relying only on the boot-time `window.__LOS_CAPS__` snapshot and the replay-less `los:caps` setup event, so a successful registration shows `Shortcut: registered` per SC-U08 (partial)
- [x] T102 Honor persisted shortcut settings at startup in `apps/desktop/src-tauri/src/lib.rs` and `apps/desktop/src-tauri/src/shortcuts.rs`: apply the saved `WorkspaceSettings` accelerator and enabled flag after workspace boot (Rust-side or via a post-boot TS `shortcuts_reregister` call) instead of always registering the hardcoded `CommandOrControl+Shift+L` as enabled, per 002 FR-H09 / FR-U14 (partial)
- [x] T103 Verify end-to-end in `tauri:dev` and record evidence in `specs/004-lead-command-ux/checklists/verification-evidence.md`: global shortcut opens Quick Capture, LocalStatus shows `Shortcut: registered`, changing the accelerator in Settings re-registers successfully, and in-app Inbox capture still works if registration is forced to fail per SC-U08 (partial)

---

## Phase 22: Premium command-center refresh (2026-10-20 user brief)

**Input**: `design-refresh-2026-10-20.md` (audit + design system + screen map).
**Correction**: priority/actual/application/dependency fields and separate
trade-off/outcome/carryover notes ARE service-supported (`planningWorkUpsert`,
`planningPeriodSaveMeta/Close`) — wire them in UI; no domain/SQLite change.

- [x] T104 [US1] Refine graphite/light tokens (indigo accent, surfaces, tabular numerals, panel widths) in `tokens.css`/`base.css`
- [x] T105 [US1] Grouped sidebar (Workspace/System), shortcut hints + Inbox count, contextual page header with Quick Capture + ⌘K actions, Cmd/Ctrl+1..6 nav in `AppShell.tsx`/`Nav.tsx`/`App.tsx`
- [x] T106 [US4] Group palette actions with shortcut hints in `CommandPalette.tsx`
- [x] T107 [US3] Planning canvas: full summary (net/committed/remaining/unallocated/unestimated), workload bars with over/zero-capacity text, actionable warnings (Review → affected item/member), capacity formula caption in `CapacityPlanPage.tsx`
- [x] T108 [US3] Right detail panel for work items exposing priority/estimate/actual/application/dependency/status/assignee/kind (service-backed); committed ≠ stretch by text+symbol; closed = read-only
- [x] T109 [US3] Inline close review (warnings, counts, carry-forward, separate trade-off/outcome/carryover, explicit acknowledgement) replacing `window.confirm` close + fixing carryover=tradeoff conflation
- [x] T110 [US1] Today as daily brief (next actions / blockers / follow-ups-decisions) on existing Daily Review fields + autosave
- [x] T111 Add pure planning view helpers + focused tests (`planningView.ts`, domain-side test placement per repo conventions); run `pnpm test && pnpm lint && pnpm --filter @los/desktop build`; record evidence + honest gaps

---

## Phase 23: Weekly planning, reset, keep, manageable team, keyboard (2026-10-20)

- [x] T112 Weekly capacity periods (7d `weekContaining/previousWeek/nextWeek`); capacity service + UI relabeled Weekly; personal Fortnight plan unchanged
- [x] T113 Inbox Keep-for-later as a real `kept` status (domain + migration v3 + `listKept` + Return-to-inbox); smoke tests updated to new semantics
- [x] T114 Settings Reset all data with optional export-first, inline keyboard confirmation; persistence `resetWorkspaceData` + Tauri/preview wiring
- [x] T115 Team roster rename/activate/deactivate; Applications rename/reset-name with Esc-cancel inline edits
- [x] T116 Keyboard: `?` shortcuts dialog, arrow keys in sidebar/tabs/work & workload rows, Esc closes detail panel with focus return, no `window.confirm` left (inline acks), Settings keyboard section

## Phase 24 — Fix saves/reset, Threads + roster removal, tour, tray + LOS logo (2026-10-20 batch 2)

- [x] T112 Diagnose save/reset failures: cleaned smoke-test pollution from the real app-data DB (backup /tmp/los-real-backup-before-clean.sqlite); pointed app-data smoke tests at an isolated temp DB; serialized Tauri SQL adapter through a single queue with BEGIN IMMEDIATE so transactions can never interleave into a dangling write transaction ("database is locked")
- [x] T113 Reset all data in Tauri is now file-based: close DB, delete los.sqlite (+wal/shm/journal) via `db_reset_all`, reboot creates a fresh migrated+seeded DB; preview still uses the table-wipe service reset
- [x] T114 Rename Applications → Threads (all user-facing copy); threads can be added beyond four and removed when unused (service refuses when linked to actions/planning work); migration v4 lifts the 4-slot cap; seed names Thread 1–4
- [x] T115 Roster members can be removed when unused (refused when allocations exist; deactivate remains the history-preserving option), with inline confirm panels — zero window.confirm remain
- [x] T116 Guided UI tour: 9 steps across nav, capture, palette, Today, Inbox, Planning, Threads, Settings; highlight + card, Back/Next/Skip/Esc, first-run auto-open, replay from palette/Settings; plus visible toast feedback and optimistic Inbox triage with rollback
- [x] T117 LOS wordmark (attached image) applied: sidebar light/dark logos, macOS tray now sets an explicit icon (was missing → invisible), app bundle icons generated (indigo rounded square, white wordmark)
- [x] T118 Added app-services tests for thread create/remove (+linked refusal) and member remove (+allocated refusal); full suites green, desktop build + cargo check pass, live dev DB migrated to schema v4

## Phase 25 — Human copy, modern controls, list redesign, reviews calendar (2026-10-20 batch 3)

- [x] T119 Humanized user-facing copy across pages and removed every em/en dash from desktop copy (plain words, short sentences, examples like "For example: reply to Priya...")
- [x] T120 Replaced all native dropdowns with a custom Select (button + listbox, arrows/Home/End/typeahead/Esc, click outside) and all native checkboxes with a custom Checkbox (real input for keyboard/screen readers, drawn box); added a Segmented pill filter. No `<select>` or visible native checkbox remains
- [x] T121 Redesigned Actions list: create bar with its own Thread picker, segmented Still to do/Done/Everything filter, round tick-off buttons, status/thread chips, inline edit with Enter/Esc; Fortnight plan rebuilt in the same item-row pattern (picked list with Take out, open actions with custom checkboxes and picked counts)
- [x] T122 Fixed Team roster alignment: Display name + Add member in one aligned card, roster as a Person/Status/Actions grid with avatar initials, stable columns for rename/remove states
- [x] T123 Calendar view for Reviews & history (new default tab): month grid honoring the week-start setting, Brief/Blocked markers per day, Week open/closed/Conflicted markers per week, side panel with the day's brief snippet, week status, and monthly review; month navigation + Today
- [x] T124 Verification: full tests green (one flaky shared-temp-DB smoke failure fixed by isolating smoke DB paths; a pre-existing app-services lint error in threads_members.test.ts fixed), lint clean, desktop build pass, browser-verified calendar, Actions dropdown, and roster alignment
