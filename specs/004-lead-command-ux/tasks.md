# Tasks: Lead Command Center UX & Design System

**Input**: Design documents from `/specs/004-lead-command-ux/`  
**Prerequisites**: plan.md, spec.md (clarify 2026-10-19 applied), research.md, data-model.md, contracts/ui-shell.md, quickstart.md  
**Git branch**: `feature/005-lead-command-ux` | **Feature dir**: `specs/004-lead-command-ux`  
**Governance**: Constitution v1.1.0 applied. Feature **complete** requires Desktop UX verification evidence (T001 / T058).  
**Rule**: Never mark `[X]` without a verification-evidence row  
**Baseline**: Do not change 001–003 domain rules, SQLite contracts, soft-gate/freeze/carry-forward; do not fake missing 003 fields (FR-U12)

**Tests**: Scripted UI verification + domain regression (`pnpm test`); SC-U04 = manual contrast spot-check. No TDD suite required.

**Remediation (post-clarify)**: Actions under Inbox; Team/Reviews section sub-nav; constitution gate for complete-only; closed read-only presentation; contrast method locked.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Evidence stub, folders, tokens entry, window sizing

- [x] T001 Record constitution complete-gate status in `specs/004-lead-command-ux/checklists/verification-evidence.md`: either apply v1.1.0 to `.specify/memory/constitution.md` via `/speckit-constitution`, or note written time-bounded exception — **does not block coding after spec approval**; **blocks feature complete**
- [x] T002 Create `specs/004-lead-command-ux/checklists/verification-evidence.md` stub with rows for SC-U01–U07 (incl. SC-U04 contrast columns), FR-U13, closed read-only, constitution complete-gate, 003 Track B follow-ups
- [x] T003 Create dirs `apps/desktop/src/styles/`, `apps/desktop/src/ui/`, `apps/desktop/src/shell/` per plan.md
- [x] T004 Create `apps/desktop/src/styles/tokens.css` with `theme` `"dark" | "light"` (default dark graphite), color/type/space/radius tokens, and semantic status `--status-ok`, `--status-warning`, `--status-danger`, `--status-unknown`, `--status-conflicted`, `--status-muted`
- [x] T005 [P] Create `apps/desktop/src/styles/base.css` with shared form resets and visible `:focus-visible` rings; import tokens+base from `apps/desktop/src/main.tsx` and/or slim `apps/desktop/src/styles.css`
- [x] T006 [P] Set Tauri default ≥1200×800 and practical minimum ≥1024×680 in `apps/desktop/src-tauri/tauri.conf.json` (`minWidth`/`minHeight` if supported; else document fallback); document in `apps/desktop/README.md` (FR-U13)

---

## Phase 2: Foundational (Blocking Prerequisites)

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

## Phase 3: User Story 1 — Coherent shell and navigation (Priority: P1) 🎯 MVP

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

## Phase 4: User Story 2 — Design tokens and reusable components (Priority: P1)

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

## Phase 5: User Story 3 — Information-clear capacity planning surface (Priority: P1)

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

## Phase 6: User Story 5 — Honest persistence and system states (Priority: P1)

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

## Phase 7: User Story 4 — Contextual editing and command palette (Priority: P2)

**Goal**: Meta/Ctrl+K palette including Personal Actions  
**Independent Test**: SC-U05; empty filter → EmptyState

### Implementation

- [x] T045 [P] [US4] Implement `apps/desktop/src/shell/CommandPalette.tsx` with `PaletteAction` per `contracts/ui-shell.md`
- [x] T046 [US4] Register `Meta+K` / `Ctrl+K` + Escape in `apps/desktop/src/shell/AppShell.tsx`; do not break global capture shortcut / tray Quick Capture
- [x] T047 [US4] Wire palette actions for Today, Inbox, **Actions**, Planning, Team, Reviews, Settings, Quick Capture in `CommandPalette.tsx` + `routes.ts`; empty filter → `EmptyState`
- [x] T048 [US4] Record SC-U05 timed palette→Planning dry-run in `specs/004-lead-command-ux/checklists/verification-evidence.md`

**Checkpoint**: Keyboard jump to Planning and Actions without sidebar hunting

---

## Phase 8: User Story 6 — Accessibility and desktop practicality (Priority: P2)

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

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T054 [P] Align `specs/004-lead-command-ux/quickstart.md` with nav labels, Inbox→Actions, Team/Reviews sub-nav, shortcuts, window sizes, contrast method
- [x] T055 [P] Align `specs/004-lead-command-ux/plan.md` clarification→design mapping with post-clarify decisions (Actions secondary, section sub-nav, governance B, closed read-only, contrast B)
- [x] T056 Run `pnpm test && pnpm lint && pnpm --filter @los/desktop build` (+ `cargo check` in `apps/desktop/src-tauri` if used); paste into verification-evidence.md (SC-U06/U07)
- [x] T057 Honesty pass: 003 Track B listed in verification-evidence.md; do **not** mark FR-C05/C09/C12 done by restyle (FR-U11/U12)
- [x] T058 Final constitution Desktop UX gate evidenced in verification-evidence.md (applied v1.1.0 or exception from T001) — required for feature **complete**

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational → US1 → US2 → US3 → US5 (P1) → US4 / US6 (P2) → Polish
- T001 does **not** block Phase 1–8 coding after spec approval; T058 blocks **complete**

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 Shell | Phase 2 (+ SectionSubNav) |
| US2 Tokens | US1 + Phase 2 |
| US3 Planning | US1 + StatusCue/Banner |
| US5 Persistence | US2 SaveIndicator/EmptyState |
| US4 Palette | US1 routes (incl. `actions`) |
| US6 A11y | US1 + focus/tokens |

### Parallel Opportunities

- T005 ∥ T006; T009–T014 ∥ T016 after T007/T008  
- T028 ∥ T029 after T026  
- T045 after T017  
- T054 ∥ T055 in polish  

### Parallel Example: Foundational

```bash
Task: "Add Field.tsx in apps/desktop/src/ui/Field.tsx"
Task: "Add Select.tsx in apps/desktop/src/ui/Select.tsx"
Task: "Add Banner.tsx in apps/desktop/src/ui/Banner.tsx"
Task: "Add SectionSubNav.tsx in apps/desktop/src/shell/SectionSubNav.tsx"
```

---

## Implementation Strategy

### MVP

Phases 1–5 through T038 (shell with Actions/Team/Reviews IA + tokens + Planning honesty/closed read-only) after **spec approval**.

### Incremental

1. Setup + Foundational  
2. US1 shell IA  
3. US2 theme/primitives  
4. US3 Planning honesty  
5. US5 save/empty  
6. US4 palette  
7. US6 a11y  
8. Polish + constitution complete-gate (T058)

---

## Requirement Traceability

| Requirement / SC | Tasks |
|------------------|-------|
| FR-U01 shell + Actions secondary + Team/Reviews sub-nav | T016–T025 |
| FR-U02 tokens | T004–T005, T007, T026 |
| FR-U03 primitives (+ Select used) | T008–T015, T027–T030 |
| FR-U04 non-color status | T011, T015, T034–T035, T042 |
| FR-U05 Planning + closed read-only | T032–T038 |
| FR-U06 progressive disclosure | T032, T051 |
| FR-U07 palette (+ Actions) | T045–T048 |
| FR-U08 save patterns | T012, T039–T044 |
| FR-U09 keyboard + focus | T005, T018, T049–T053 |
| FR-U10–U12 | T037, T056–T057 |
| FR-U13 window sizes | T006, T051 |
| SC-U01 | T053 |
| SC-U02–U03 | T034–T035, T038 |
| SC-U04 contrast + theme | T031 |
| SC-U05 | T048 |
| SC-U06–U07 | T056 |
| Constitution complete-gate | T001, T058 |

---

## Notes

- Track B (003) remains out of 004 implementation  
- Format: all tasks use `- [x] Tnnn [P?] [USn?] …` with file paths  
- Sync note: `contracts/ui-shell.md` updated with this remediation; run T055 for plan.md alignment during polish (or before implement)
