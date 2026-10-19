# Research: Lead Command Center UX

**Feature**: `specs/004-lead-command-ux` | **Git branch**: `feature/005-lead-command-ux`  
**Date**: 2026-10-19  
**Status**: Phase 0 complete (refreshed for modern minimalism polish)

## R1. UI framework

**Decision**: Stay on **React 19 + CSS custom properties** in `apps/desktop`. Do **not** add MUI, Tailwind, or shadcn in this feature.

**Rationale**: Repo has zero MUI/Tailwind usage; adding a framework expands scope and couples VI (modular architecture) to a heavy dependency without proven need. Existing styles already use CSS variables—evolve `tokens.css` + small primitives.

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

**Decision**: Feature **implementation complete** gated on Desktop UX verification evidence under constitution **v1.1.0** (Principle X + Desktop UX gate already applied in `.specify/memory/constitution.md`). Theme/typography remain feature-level (not constitutional).

**Rationale**: Honesty, keyboard, and progressive-disclosure requirements this feature delivers are now constitutional; “done” still needs evidence, not just code.

## R8. Modern minimalism (plan refresh)

**Decision**: Treat “modern + minimalistic” as **presentation and flow density**, not a new IA:

| Principle | Concrete choice |
|-----------|-----------------|
| Calm chrome | Slim sidebar (~200px), quiet brand (LOS + one short local-first line), LocalStatus as footer text—not a status dashboard |
| Flat surfaces | Prefer hairline dividers / spacing over stacked bordered cards; list rows use subtle separators; reserve elevated panels for interactive clusters (forms, palette, confirm dialogs) |
| Background | Soft single-plane or very low-contrast atmosphere; **tone down** large accent radial washes so content, not glow, leads |
| Hierarchy | One `h1` + one short lede per primary surface; essential decisions and blocking banners first; advanced detail collapsed |
| Color | Keep graphite dark / polished light; accent for focus/active only; **no** purple-indigo theme, cream+terracotta kit, glow rings, or multi-layer shadows |
| Motion | Exactly 2–3 intentional moments: palette open/close, theme cross-fade (or instant if flash risk), optional route content fade ≤150–200ms—no decorative animation noise |
| Flows | Capture → Inbox → Planning remains the shortest keyboard path; empty states name one next action; Settings groups prefs without card grids |
| Honesty floor | Minimalism MUST NOT remove StatusCue/Banner/SaveIndicator text; conflict/error/closed cues stay visible (FR-U04/U06/U08) |

**Rationale**: Spec already asked for calm, precise, readable UI; current `base.css` still leans card-bordered and accent-washed. User refresh asks to finish the visual/UX story toward modern minimal without reopening domain scope.

**Alternatives considered**:

- Full redesign as a new feature `006` (deferred—same branch/IA; polish fits 004 Track A)
- Dense “mission control” dashboard with stat strips (rejected—fights minimalism and user frontend rules)
- New component library (rejected—R1)
- Removing Planning summary density (rejected—capacity decisions need load/remain/unknown; use progressive disclosure, not deletion)

## Resolved clarifications

All Technical Context items are decided (no remaining `NEEDS CLARIFICATION`). Spec clarify session 2026-10-19 (framework, theme, nav IA, 003 split) remains binding. Modern minimalism is an additive visual/flow decision (R8), not a constitution or domain change.
