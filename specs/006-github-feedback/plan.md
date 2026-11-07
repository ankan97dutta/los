# Implementation Plan: GitHub Feedback Button

**Branch**: `feature/007-github-feedback` (git) | **Feature dir**: `specs/006-github-feedback` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-github-feedback/spec.md`, including the 2026-11-07 clarify session (5 answers, all binding).

**Baselines**: Constitution v1.1.0; 001–005 complete on this product line. No schema, domain rule, or primary route from 001–005 is weakened. Existing stack only: React 19, TypeScript 5, Tauri 2, current CSS tokens. One new Tauri capability/plugin may be added for opening external URLs (see R2 in [research.md](./research.md)).

> **Numbering note**: Spec artifacts live under `006-*`. Git branch is `feature/007-github-feedback`. Keep the directory as 006.

## Summary

Add an opt-in Feedback flow that hands the lead to GitHub Issues without LOS accounts or tokens:

1. **Draft UI (P1)**: Modal from Settings and command palette; required kind (Bug / Idea / Other), title, description; visible optional diagnostics (app version, platform); privacy warning before continue.
2. **Handoff (P1)**: Pure URL builder prefers per-kind issue form/template when configured, else blank `new` with kind labels; opens default browser; on success closes modal and confirms browser opened (never “issue filed”). Oversized body → title/kind in URL, full body on clipboard + paste note.
3. **Degrade offline (P3)**: Failed open keeps draft, shows non-blocking error, core shell stays usable; user can copy draft or dismiss.

No SQLite changes. No GitHub API. Destination repo and kind→template/label map are fixed product config for official builds.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Rust (edition 2021) for the Tauri shell only (plugin/capability wiring)

**Primary Dependencies**: Existing `@los/domain`, `@los/app-services`, `@los/persistence`, Tauri 2, Vite 6. New: Tauri opener (or equivalent) for external HTTPS URLs — see R2. Clipboard via existing `navigator.clipboard` pattern used by Reports. No GitHub SDK, no OAuth, no new UI framework.

**Storage**: N/A for Feedback drafts (session-only React state). No migration. No `localStorage` persistence of drafts in v1.

**Testing**: Vitest unit tests for draft validation, diagnostics composition, URL/template selection, prefill vs clipboard-fallback decision, and label/query encoding in `packages/domain` (or colocated pure module tests). Desktop component tests optional; manual verification per [quickstart.md](./quickstart.md).

**Target Platform**: macOS + Windows desktop via Tauri; Vite preview must degrade honestly (open via `window.open` or clear “desktop only” path — see R3). No mobile.

**Project Type**: Desktop app feature on the existing pnpm monorepo (`apps/desktop` + shared packages)

**Performance Goals**: Continue handoff returns UI confirmation within 1 second of a successful OS open call. URL build is synchronous and negligible.

**Constraints**: Offline core unchanged. Feedback is network-dependent and must fail soft (Constitution I, III, X). No stored GitHub credentials. No silent upload of workspace data. Prefill URL length budget enforced (R4). Official destination fixed to the public LOS GitHub repo (R1).

**Scale/Scope**: One modal, one Settings entry, one palette action, one config module, one opener adapter. No new package.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Disposition |
|------|-------------|
| Offline core | Pass. Feedback requires network only at continue; failure leaves Today/Inbox/Planning usable. |
| No LLM required | Pass. No AI involved. |
| Privacy default | Pass. Explicit continue after visibility warning; diagnostics optional and editable; no telemetry; no tokens. |
| Adapter isolation | Pass. Browser open and clipboard live in desktop helpers; pure draft/URL logic has no Tauri imports. Domain/app-services never call GitHub HTTP. |
| Ownership clarity | Pass. Created issues are GitHub-owned; LOS only hands off a user-authored draft. |
| Modular boundaries | Pass. Validation + URL construction are pure TS; UI in `apps/desktop`; opener wrapped once. |
| Migration safety | Pass. No schema change. |
| Test evidence | Pass with work. Unit tests for pure handoff rules + quickstart evidence for Settings/palette/offline paths. |
| Spec completeness | Pass. Spec + clarify done; this plan set completes planning; tasks next. |
| Desktop UX | Pass. Keyboard-operable modal; accessible names; success/failure worded (not color-only); no claim that issue was filed. |

**Post-design re-check**: Opener plugin is optional OS integration that fails soft (same pattern as notifications/shortcuts). No gate needs an exception. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-github-feedback/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── feedback-handoff.md
├── checklists/
│   └── requirements.md
└── tasks.md             # next: /speckit-tasks
```

### Source Code (repository root)

```text
packages/domain/src/
├── feedback.ts              # NEW: kinds, draft validation, diagnostics text, URL build, length budget
└── index.ts                 # EXTEND exports

packages/domain/tests/
└── feedback.test.ts         # NEW

apps/desktop/
├── src/lib/feedbackConfig.ts    # NEW: repo owner/name, per-kind template/form ids, labels
├── src/lib/feedbackOpen.ts      # NEW: open external URL (Tauri opener + preview fallback)
├── src/features/feedback/
│   ├── FeedbackDialog.tsx       # NEW: modal draft UI
│   └── feedbackCopy.ts          # NEW: user-facing strings (warning, confirm, errors)
├── src/features/settings/SettingsPage.tsx   # EXTEND: Feedback entry button
├── src/shell/CommandPalette.tsx             # EXTEND: Feedback action + run kind
├── src/App.tsx                              # EXTEND: open Feedback from palette / settings callback
├── src-tauri/Cargo.toml                     # EXTEND: opener plugin if required
├── src-tauri/capabilities/default.json      # EXTEND: allow open HTTPS to github.com
└── package.json                             # EXTEND: @tauri-apps/plugin-opener if required
```

**Structure Decision**: Keep logic in `@los/domain` for testability; desktop owns config constants, modal, Settings/palette wiring, and OS open/clipboard adapters. No new workspace package.

## Complexity Tracking

> No constitution violations requiring justification.
