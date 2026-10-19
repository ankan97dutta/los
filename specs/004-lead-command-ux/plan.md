# Implementation Plan: Lead Command Center UX & Design System

**Branch**: `feature/005-lead-command-ux` (git) | **Feature dir**: `specs/004-lead-command-ux` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-lead-command-ux/spec.md`  
**Gate**: Spec approval unlocks UI implementation. Constitution v1.1.0 applied (or written time-bounded exception) required before calling this feature **complete**  
**Baselines**: 001–003 domain/persistence unchanged; no new UI framework

> **Numbering note**: Spec artifacts live under `004-*` (created before the feature branch). Git branch is `feature/005-lead-command-ux` because sequential numbering saw `specs/004-*` already present. Prefer `SPECIFY_FEATURE_DIRECTORY=specs/004-lead-command-ux` (persisted in `.specify/feature.json`).

## Summary

Introduce a coherent **Lead OS command-center** presentation layer: CSS design tokens (dark graphite + light), reusable primitives, remapped shell navigation (Today / Inbox / Planning / Team / Reviews / Settings), honest status/save/empty/error patterns, command palette, and a clearer Planning/capacity information hierarchy—**without** altering capacity math, freeze/soft-gate rules, or inventing fake 003 fields.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19; Rust/Tauri 2 shell (window size, tray, shortcut only)

**Primary Dependencies**: Existing `@los/*` packages, Tauri 2, Vite; **no** MUI/Tailwind/shadcn

**Storage**: No schema change for MVP. Theme preference in `localStorage` (`los.ui.theme`) — UI-only, not synced. Avoid `WorkspaceSettings` / SQLite migration unless a later task proves backup-restore of theme is required.

**Testing**: Vitest keeps 001/003 domain + capacity unit tests green; desktop smoke for keyboard path, theme toggle, conflicted/unknown labels; verification-evidence checklist rows for SC-U01–U07

**Target Platform**: macOS-first desktop (same as foundation)

**Project Type**: Desktop presentation feature on existing monorepo (`apps/desktop`)

**Performance Goals**: Shell navigation and palette open feel immediate (&lt;100ms perceived); palette→Planning under 5s timed dry-run (SC-U05); no domain regressions

**Constraints**: Local-first; keyboard-operable primary paths; non-color-only decision-critical status; preserve tray/global shortcut; practical window sizes; no Jira/LLM/account required; do not fake missing 003 fields

**Scale/Scope**: Reskin + shell + palette + Planning hierarchy for **existing** service data; ~6 nav destinations; small primitive set (button, field, select, row, banner, save indicator, empty state)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Disposition |
|------|-------------|
| Offline core | Pass — no network UI requirements |
| No LLM required | Pass — presentation only |
| Privacy default | Pass — theme pref local (`localStorage`); no outbound |
| Adapter isolation | Pass — N/A (no new adapters) |
| Ownership clarity | Pass — no sync ownership change |
| Modular boundaries | Pass — tokens/components in `apps/desktop`; domain/persistence untouched |
| Migration safety | Pass — no schema for MVP theme storage |
| Test evidence | Pass — regression `pnpm test` + UI verification checklist |
| Spec completeness | Pass when checklist + evidence exist at implement |
| Desktop UX (v1.1.0) | Pass — keyboard, non-color-only status, observable saves, progressive disclosure tasked + evidenced at complete |

**Post-design re-check**: Complexity limited to desktop presentation (`styles/`, `ui/`, `shell/`, page restyles). Domain and SQLite contracts unchanged. Track B (003 missing fields / soft-gate blind spot) explicitly out of scope — no Complexity Tracking row invents domain work. Gate for “done”: constitution proposal applied or written exception.

## Project Structure

### Documentation (this feature)

```text
specs/004-lead-command-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md              # from /speckit-tasks (not created by this command)
├── contracts/
│   └── ui-shell.md
└── checklists/
```

### Source Code (touch set)

```text
apps/desktop/
  src/
    styles/
      tokens.css            # graphite/light + semantic status tokens
      base.css              # reset, focus rings, typography base
    ui/                     # Button, Field, Select, Banner, SaveIndicator, EmptyState, Row
    shell/
      AppShell.tsx
      Nav.tsx
      CommandPalette.tsx
    features/…              # existing pages consume ui/ + shell routes
    App.tsx                 # wire shell + remapped routes
    styles.css              # thin entry → import tokens/base (or replace)
  src-tauri/
    tauri.conf.json         # default/min window sizes (FR-U13)
.specify/proposals/
  2026-10-19-constitution-ux-amendment.md   # apply separately when approved
```

**Structure Decision**: Keep all presentation work inside `apps/desktop`. Do not add a `@los/ui` package in this feature (YAGNI; extract later if a second consumer appears). Domain, app-services, and persistence packages are **read-only** for 004 unless a bug blocks honest presentation of already-returned API fields.

## Complexity Tracking

> No constitution violations requiring justification. Scope debt only:

| Debt | Why tracked | Simpler alternative rejected |
|------|-------------|------------------------------|
| Spec `004` vs branch `005` | Sequential branch script saw existing `specs/004-*` | Renaming dir mid-draft risks breaking links; keep dir `004`, document branch |
| Theme in localStorage not SQLite | Avoid migration for UI chrome | WorkspaceSettings column → persistence touch + backup note for chrome-only pref |
| 003 Track B gaps remain open | Soft-gate UI hole / missing editors are domain/product gaps | Faking fields in 004 layout → violates FR-U12 |

## Clarification → design mapping

| Spec decision | Design impact |
|---------------|---------------|
| No new UI framework | CSS variables + React components under `apps/desktop/src/ui` |
| Nav remap | Primary: Today/Inbox/Planning/Team/Reviews/Settings. **Actions** = Inbox secondary. Team = Roster\|Applications sub-nav. Reviews = Monthly\|Planning history sub-nav |
| Dual theme | `tokens.css` with `[data-theme="dark\|light"]`; default dark graphite; toggle in Settings |
| Theme persistence | `localStorage` key `los.ui.theme` (R2 locked) |
| Contrast (SC-U04) | Manual spot-check body/muted/status on Inbox+Planning × both themes → verification-evidence |
| Closed period UX | Read-only presentation for frozen structure (non-focusable); notes/history per 003 |
| Command palette | In-app filterable list; `Meta+K` / `Ctrl+K`; navigate (incl. Actions) + quick-capture |
| 003 gaps | Planning shows existing fields + API totals/warnings; omit unimplemented editors |
| Window sizes | Default ≥1200×800, minimum ≥1024×680 in `tauri.conf.json` + README |
| Constitution 1.1.0 | Applied; **complete** gated on Desktop UX verification evidence (T058) |

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/ui-shell.md](./contracts/ui-shell.md) |
| Quickstart | [quickstart.md](./quickstart.md) |
| Constitution proposal | [../../.specify/proposals/2026-10-19-constitution-ux-amendment.md](../../.specify/proposals/2026-10-19-constitution-ux-amendment.md) |
