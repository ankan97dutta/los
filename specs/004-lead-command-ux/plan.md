# Implementation Plan: Lead Command Center UX & Design System

**Branch**: `feature/005-lead-command-ux` (git) | **Feature dir**: `specs/004-lead-command-ux` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-lead-command-ux/spec.md`  
**Plan refresh (2026-10-19)**: Modern, minimalistic chrome polish  
**Plan refresh (2026-10-20)**: Clarify session — **FR-U14 / SC-U08** LocalStatus tray/shortcut cause phrases (preview vs OS/registration)  
**Gate**: Spec approval unlocks UI implementation. Constitution v1.1.0 applied; feature **complete** still requires Desktop UX verification evidence  
**Baselines**: 001–003 domain/persistence unchanged; no new UI framework

> **Numbering note**: Spec artifacts live under `004-*`. Git branch is `feature/005-lead-command-ux`. Prefer `SPECIFY_FEATURE_DIRECTORY=specs/004-lead-command-ux` (`.specify/feature.json`).

## Summary

Deliver a coherent **Lead OS** presentation layer that is **modern and minimal**: restrained tokens, slim shell, progressive disclosure, honest status/save cues, command palette, Planning hierarchy—**without** altering capacity math or inventing fake 003 fields.

**Landed**: Shell/IA, primitives, modern-minimal polish (T001–T088).  
**Remaining increment**: Implement **FR-U14** LocalStatus copy so Vite preview does not look like a broken desktop shell (`n/a (browser preview)` vs Tauri `unavailable (registration failed)` / `unavailable (OS)`), plus SC-U08 evidence. Settings keeps a short Tauri-only note only (no duplicate FR-U14 phrases).

## Technical Context

**Language/Version**: TypeScript 5.x, React 19; Rust/Tauri 2 shell (window size, tray, shortcut only)

**Primary Dependencies**: Existing `@los/*` packages, Tauri 2, Vite; **no** MUI/Tailwind/shadcn

**Storage**: No schema change. Theme in `localStorage` (`los.ui.theme`). Capability cues are runtime-only (detect Tauri via `window.__TAURI__` / existing `WorkspaceRuntime` capability flags)—no persistence.

**Testing**: Vitest keeps 001/003 domain + capacity unit tests green; SC-U08 Vite preview LocalStatus phrase check; Tauri registration-fail path when exercising shortcut deny; verification-evidence rows for SC-U01–U08

**Target Platform**: macOS-first desktop (same as foundation); Vite preview is a supported **dev** surface with honest capability cues

**Project Type**: Desktop presentation feature on existing monorepo (`apps/desktop`)

**Performance Goals**: Unchanged — shell/palette immediate; palette→Planning &lt;5s (SC-U05)

**Constraints**: Local-first; non-color-only status; FR-U14 forbids flat “unavailable” for preview; Settings must not duplicate FR-U14 phrases; in-app capture always usable when tray/shortcut inactive

**Scale/Scope**: Touch `LocalStatus.tsx` (+ optional tiny helper); optional one-line Settings Tauri note if missing; no domain/API changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Disposition |
|------|-------------|
| Offline core | Pass — no network UI requirements |
| No LLM required | Pass — presentation only |
| Privacy default | Pass — theme pref local; no outbound |
| Adapter isolation | Pass — N/A (no new adapters) |
| Ownership clarity | Pass — no sync ownership change |
| Modular boundaries | Pass — LocalStatus in `apps/desktop`; domain untouched |
| Migration safety | Pass — no schema |
| Test evidence | Pass — SC-U08 + regression |
| Spec completeness | Pass when evidence updated at implement |
| Desktop UX (v1.1.0) | Pass — tray/shortcut degrade honesty is Principle X / FR-U14 |

**Post-design re-check**: FR-U14 is presentation-only honesty over existing capability flags. Detect preview as **absence of Tauri** (`!window.__TAURI__` or equivalent runtime flag already used at boot). Do not fake tray/shortcut as available in Vite.

## Project Structure

### Documentation (this feature)

```text
specs/004-lead-command-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md              # append FR-U14 tasks via /speckit-tasks or /speckit-converge
├── contracts/
│   └── ui-shell.md
└── checklists/
```

### Source Code (touch set for FR-U14)

```text
apps/desktop/src/
  features/status/LocalStatus.tsx   # canonical FR-U14 phrases
  features/settings/SettingsPage.tsx  # optional short Tauri-only note (no FR-U14 duplicate)
  App.tsx / lib/runtime.ts          # read-only unless capability flag plumbing gaps
```

**Structure Decision**: Keep capability phrasing in LocalStatus. Reuse existing `trayAvailable`, `globalShortcutAvailable`, `globalShortcutRegistered`, `globalShortcutError` from workspace status.

## Complexity Tracking

| Debt | Why tracked | Simpler alternative rejected |
|------|-------------|------------------------------|
| Spec `004` vs branch `005` | Sequential branch script | Keep dir `004`, document branch |
| Theme in localStorage | Avoid migration | SQLite for chrome-only pref |
| 003 Track B gaps | Domain follow-ups | Fake editors in 004 |
| Bare “unavailable” in Vite today | Confuses preview users | Leave as-is → violates FR-U14 |

## Clarification → design mapping

| Spec / user decision | Design impact |
|----------------------|---------------|
| … (prior 2026-10-19 rows unchanged) | See earlier plan history |
| Modern minimalism (R8) | Landed in T059–T088 |
| **FR-U14 preview vs OS (2026-10-20)** | LocalStatus cause classes + exact phrases (R9) |
| **Canonical phrases (clarify A)** | Preview: `Tray: n/a (browser preview)` / `Shortcut: n/a (browser preview)`; Tauri shortcut fail: `Shortcut: unavailable (registration failed)` (+ error); Tauri tray: `Tray: unavailable (OS)` |
| **Settings ownership (clarify B)** | LocalStatus owns FR-U14 phrases; Settings short Tauri-only note only |

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/ui-shell.md](./contracts/ui-shell.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Next command

`/speckit-tasks` or `/speckit-converge` to append implementable FR-U14 / SC-U08 tasks (do not reopen T001–T088). Then `/speckit-implement`.
