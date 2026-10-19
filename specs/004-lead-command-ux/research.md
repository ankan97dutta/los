# Research: Lead Command Center UX

**Feature**: `specs/004-lead-command-ux` | **Git branch**: `feature/005-lead-command-ux`  
**Date**: 2026-10-19  
**Status**: Phase 0 complete (implementation still gated on constitution amendment approval)

## R1. UI framework

**Decision**: Stay on **React 19 + CSS custom properties** in `apps/desktop`. Do **not** add MUI, Tailwind, or shadcn in this feature.

**Rationale**: Repo has zero MUI/Tailwind usage; adding a framework expands scope and couples VI (modular architecture) to a heavy dependency without proven need. Existing `styles.css` already uses CSS variables—evolve that into `tokens.css` + small primitives.

**Alternatives considered**: MUI (rejected—new stack); Tailwind (rejected—new toolchain); shadcn (rejected—implies Tailwind); extract `@los/ui` package (deferred—single consumer today).

## R2. Theme persistence

**Decision**: Dual theme via CSS variables: **dark graphite default**, **light polished** secondary. Persist preference in **`localStorage`** key `los.ui.theme` (`"dark" | "light"`). Apply via `document.documentElement.dataset.theme`.

**Rationale**: Avoids SQLite migration and backup/restore coupling for chrome-only preference. Settings page hosts the toggle; first paint reads localStorage before paint where practical (`main.tsx` / inline script) to reduce flash.

**Alternatives considered**: `WorkspaceSettings.uiTheme` column (rejected for MVP—persistence touch for non-domain data); no persistence (rejected—poor UX).

## R3. Information architecture

**Decision**: Remap chrome labels without new domain modules:

| Nav id | Label | Backing surface |
|--------|-------|-----------------|
| `today` | Today | `DailyReviewPage` |
| `inbox` | Inbox | `InboxPage` |
| `planning` | Planning | `CapacityPlanPage` primary; `FortnightPlanPage` secondary disclosure/sub-nav |
| `team` | Team | Capacity roster entry point + `ApplicationsPage` (four slots)—not multi-user auth |
| `reviews` | Reviews | `MonthlyReviewPage` + closed planning history entry |
| `settings` | Settings | `SettingsPage` |

Legacy route ids (`daily`, `capacity`, `fortnight`, `actions`, `applications`, `monthly`) may remain as aliases during migration; primary nav MUST show the new labels.

**Rationale**: Avoid placeholder routes; matches clarified Today/Inbox/Planning/Team/Reviews IA.

**Alternatives considered**: Keep Capacity/Daily/Fortnight as top-level equals (rejected—cluttered chrome); invent OKR/hiring placeholders (rejected—out of scope).

## R4. Command palette

**Decision**: Lightweight in-app palette (filterable command list), shortcut **`Meta+K` (macOS) / `Ctrl+K` (other)**. Actions = navigate to primary destinations + open Quick Capture. No external palette library.

**Rationale**: FR-U07 / SC-U05; keeps dependency surface small; matches keyboard-first command-center intent.

**Alternatives considered**: OS spotlight-only (rejected—not cross-platform in-app); third-party palette package (rejected—unnecessary).

## R5. 003 dependency split (Track A vs B)

**Decision**:

| Track A — 004 | Track B — 003 follow-up |
|---------------|-------------------------|
| Shell, tokens, status honesty, hierarchy for **existing** fields | Priority/application/deps/actual editors; soft-gate capacity-row hole; smoke flake |
| Show API totals / warnings / conflicted when present | New domain fields or service exposure |

**Rationale**: User constraint: separate visual redesign from missing business functionality (FR-U12).

## R6. Window sizing

**Decision**: Raise default window toward **1200×800**; set practical **minimum ~1024×680** (via Tauri window config if supported, else document + verify). Current `tauri.conf.json` is 1100×720—update as part of FR-U13 tasks.

**Rationale**: Spec FR-U13 / SC keyboard+Planning usability; progressive disclosure collapses secondary panels before conflict banners.

## R7. Constitution

**Decision**: Feature **implementation complete** gated on approval/apply of  
`.specify/proposals/2026-10-19-constitution-ux-amendment.md` (expand Principle X + Desktop UX gate → v1.1.0), or a written exception. Theme/typography remain feature-level (not constitutional).

**Rationale**: Proposed gate expands honesty requirements this feature delivers; applying mid-feature without approval is forbidden by prior session constraint.

## Resolved clarifications

All Technical Context items are decided (no remaining `NEEDS CLARIFICATION`). Spec clarify session 2026-10-19 (framework, theme, nav IA, 003 split) is binding.
