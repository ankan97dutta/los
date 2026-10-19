# Research: Foundational LOS Desktop Workspace

**Feature**: `001-foundation-workspace`  
**Date**: 2026-10-19

## R1. Desktop runtime

**Decision**: Tauri 2 + React + TypeScript for the desktop shell; pure TypeScript domain package tested with Vitest.

**Rationale**:
- Local-first, offline desktop with system tray and global shortcuts is a first-class Tauri/OS capability set.
- Smaller runtime than Electron; aligns with a personal utility app.
- TypeScript domain stays independent of UI and Rust shell (constitution: modular boundaries, testable without live integrations).
- User environment is macOS; Tauri supports tray + global shortcuts on macOS with graceful degradation paths.

**Alternatives considered**:
- **Electron + React**: Mature tray/shortcut ecosystem; heavier binary and stronger coupling temptation to Node APIs in domain code. Rejected for footprint and boundary discipline.
- **Native Swift/SwiftUI**: Excellent macOS UX; blocks later Windows/Linux without a rewrite. Rejected for foundation scope.
- **Flutter desktop**: Viable; team/spec context favors web-tech UI + strict TS domain tests. Rejected for stack familiarity and domain-test ergonomics.

## R2. Persistence

**Decision**: SQLite file in the OS app data directory; access via a persistence adapter; **versioned SQL migrations** applied on startup; domain never imports SQLite drivers directly.

**Rationale**:
- Constitution requires versioned migrations, transactional writes, and recoverability.
- SQLite is the standard local-first embedded store; works fully offline.
- Adapter boundary keeps domain tests on an in-memory fake repository.

**Alternatives considered**:
- **JSON/files only**: Simpler initially; weak for transactional multi-entity updates (daily review → create actions). Rejected.
- **IndexedDB in a web-only shell**: Poor fit for tray/global shortcut desktop packaging. Rejected.

## R3. Fortnight calendar math

**Decision**: Fixed 14-day periods anchored to a configurable start weekday (default **Monday**). Period identity is `(anchorWeekday, periodStartDate)` where `periodStartDate` is the Monday (or chosen weekday) of the fortnight containing “today” in the user’s local timezone. Adjacent navigation steps ±14 days.

**Rationale**: Matches clarified spec; stable history keys; testable with fixed clocks.

**Alternatives considered**:
- Rolling last-14-days window: unstable history identity. Rejected in clarify.
- User-picked arbitrary anchor without weekday: more UX complexity for v1. Deferred; weekday config is enough.

## R4. Daily next-actions → Personal Actions (idempotent autosave)

**Decision**: Each next-action line has a stable `lineId` (UUID) created when the line is first non-empty. Autosave creates Personal Actions keyed by `lineId` on first non-empty save; later autosaves update the linked **open** action’s description to match the line. Removing or clearing a line does **not** auto-delete the Personal Action. Empty lines create nothing.

**Rationale**: Prevents duplicate actions on repeated autosave; respects constitution “never silently discard user data.”

**Alternatives considered**:
- Hash-of-text identity: renames create duplicates or collide. Rejected.
- Delete action when line removed: surprising data loss. Rejected for v1.

## R5. Autosave UX

**Decision**: Debounced autosave (~400–800ms after last edit) for daily/fortnight/monthly editors; UI states: `unsaved` | `saving` | `saved` | `error`. Inbox capture and action mutations persist immediately on explicit user action (submit/toggle), not debounce.

**Rationale**: Matches clarify; immediate capture feels reliable; review editors need typing-friendly debounce.

## R6. Platform scope for v1 delivery

**Decision**: **macOS** is the primary acceptance platform for tray + global shortcut. Architecture and domain must not hardcode macOS-only types; Windows tray/shortcut can follow without domain changes.

**Rationale**: Spec allows “when OS permits”; current development host is macOS; reduces first-slice risk.

## R7. Out of scope (confirmed)

**Decision**: No Jira, Confluence, LLM, cloud sync, accounts, or telemetry in this feature. UI may show a static “Local only” status; no sync adapters.

**Rationale**: Spec FR-016 / constitution principles I–IV.

## R8. Application slots seeding

**Decision**: On first DB init, insert four rows with names `Application 1`…`Application 4` and stable slot indexes `1..4`. Renames update display name only.

**Rationale**: Clarified first-run behavior; simple seed migration.

## R9. Backup / restore (minimal)

**Decision**: Document the SQLite file path; support user-driven copy-out backup and file-replace restore; include an automated or scripted smoke that writes a known inbox item, copies DB aside, mutates/deletes, restores file, and asserts the item returns (FR-023).

**Rationale**: Constitution requires tested backup/restore; cloud backup remains out of scope.

## R10. Description length

**Decision**: Hard limit **4000** characters for inbox and personal-action descriptions.

**Rationale**: Removes “e.g. 4000” ambiguity for tests and validation.
