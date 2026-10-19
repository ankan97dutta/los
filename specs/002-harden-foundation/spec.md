# Feature Specification: Harden Foundation Persistence & Acceptance

**Feature Branch**: `feature/002-harden-foundation`

**Created**: 2026-10-19

**Status**: Clarified

**Input**: User description: "Harden the LOS foundation implementation to meet its existing constitution, plan, and acceptance criteria. Replace JSON/localStorage with SQLite in Tauri app data; versioned migrations and transactions; no silent data loss; backup/restore against real DB; finish Tauri bootstrap/handlers; daily-review atomicity; fortnight completed selections; settings-driven shortcuts; fix lint; verification evidence; reconcile tasks. Do not redesign product or weaken constitution/original spec."

**Baseline (authoritative, not rewritten)**:

- Constitution: `.specify/memory/constitution.md`
- Original feature: `specs/001-foundation-workspace/` (`spec.md`, `plan.md`, `research.md`, `tasks.md`, contracts, quickstart)
- Audit: foundation implementation audit (P0/P1/P2 findings against 001)

This feature remediates gaps so 001’s acceptance criteria and constitution gates become true. It does **not** change 001’s product scope or replace 001’s specification text.

## Clarifications

### Session 2026-10-19

- Q: When a lead first opens the hardened desktop app with valid legacy localStorage/JSON data but no SQLite file yet, how should that legacy data be handled? → A: Auto-import once when SQLite is missing and legacy data validates; show a brief success or failure notice (not silent).
- Q: When the lead saves a new global shortcut accelerator (or enables/disables it) in Settings, when should LOS apply that change to OS registration? → A: Re-register immediately after an explicit Settings save.
- Q: How must backup restore work for the live desktop SQLite database in this remediation? → A: Both documented quit-and-replace and in-app Settings restore targeting the live SQLite file.
- Q: For Vite-only browser preview (`pnpm dev` without Tauri), what persistence is required in this remediation? → A: Non-durable or labeled preview storage allowed; durable SQLite required only for Tauri-dev/packaged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Durable local database on desktop (Priority: P1)

An engineering lead uses the packaged desktop workspace; all captures, actions, and reviews persist in a real local database file under the OS application-data location documented for the app. Quitting and relaunching offline restores the same data. Corrupt or invalid prior data never silently wipes their workspace.

**Why this priority**: Without durable, non-destructive persistence, every 001 scenario that claims relaunch/offline durability is false for the desktop product.

**Independent Test**: Launch desktop offline, capture an inbox item, quit, relaunch offline, confirm the item; separately, present a corrupt prior store and confirm the original bytes are preserved and the app fails recoverably (no empty reseed overwrite).

**Acceptance Scenarios**:

1. **Given** a first launch with no prior database file, **When** the lead uses the workspace, **Then** a SQLite database is created in the documented Tauri application-data directory and four application slots are seeded exactly once.
2. **Given** the lead captured inbox items and review content, **When** they quit and relaunch with network unavailable, **Then** 100% of previously successfully saved records for this workspace remain present and readable (maps to 001 SC-002 / FR-003).
3. **Given** an existing database file is corrupt or fails validation, **When** the app starts, **Then** LOS does **not** delete or overwrite that file with a fresh seed; it surfaces a recoverable failure and preserves the original file for backup/recovery.
4. **Given** legacy browser/dev JSON or localStorage data exists and no SQLite DB yet exists, **When** the desktop app first opens a clean SQLite path, **Then** LOS MUST attempt a one-time auto-import if the legacy data validates, MUST show a brief success or failure notice (not silent), and MUST never destroy the legacy source or overwrite a healthy SQLite DB on failure.

**Audit mapping**: P0 persistence plan gap; P0 silent localStorage wipe; P0 app-data path unused · Constitution VII · 001 FR-003, FR-017, FR-023, SC-002

---

### User Story 2 - Consistent multi-entity saves (Priority: P1)

When a daily review autosave materializes next-action Personal Actions and updates the review, the lead never ends up with actions saved without the matching review lines (or the reverse) after a mid-write failure.

**Why this priority**: Partial writes break trust and violate constitution data-integrity gates for the most write-heavy path.

**Independent Test**: Force a failure after creating next-action actions but before review commit (test harness); assert either full success or full rollback with no orphaned inconsistency relative to the pre-save snapshot.

**Acceptance Scenarios**:

1. **Given** a daily review edit that creates or updates next-action-linked Personal Actions, **When** autosave succeeds, **Then** review lines and linked actions are consistent afterward.
2. **Given** a multi-entity daily save encounters an error mid-operation, **When** the operation aborts, **Then** the workspace remains at the last consistent committed state (no half-applied daily materialization).

**Audit mapping**: P1 non-atomic daily upsert · Constitution VII · 001 FR-019, FR-020, FR-017

---

### User Story 3 - Backup and restore of the real database (Priority: P1)

The lead can copy out and restore the actual desktop database file (documented path), and an automated restore smoke proves a known inbox item returns after replace.

**Why this priority**: FR-023 and constitution backup/restore gate require the real file, not a parallel localStorage export that diverges from desktop storage.

**Independent Test**: Seed known inbox item in SQLite → copy DB aside → mutate/delete → restore file → reopen → item present (automated test).

**Acceptance Scenarios**:

1. **Given** the documented SQLite path, **When** the lead (or test) copies the file out as backup (or uses Settings export of that file), **Then** the backup is a complete workspace snapshot.
2. **Given** a valid backup file and the app is quit, **When** the lead replaces the live SQLite file at the documented path and relaunches, **Then** the workspace shows the restored data.
3. **Given** a valid backup file and the app is running, **When** the lead uses Settings restore targeting the live SQLite file, **Then** the workspace reloads with the restored data without requiring a manual quit-and-replace.
4. **Given** Settings or docs describe backup/restore, **When** a lead follows them, **Then** paths and steps match the live desktop SQLite database (no claim that localStorage alone is the desktop DB).

**Audit mapping**: P0/P1 FR-023 partial · Constitution VII migration/backup gate · 001 FR-023

---

### User Story 4 - Fortnight history keeps completed selections (Priority: P2)

When the lead completes an action that was selected for a fortnight, that selection remains visible in that fortnight’s historical plan (as completed/selected work), without resurrecting the action as open.

**Why this priority**: Spec edge case already accepted in 001; current UI hides completed selections.

**Independent Test**: Select an open action on a fortnight plan, mark it done, reopen the same fortnight; selection still listed/associated.

**Acceptance Scenarios**:

1. **Given** an action selected on the current fortnight plan, **When** the lead marks it done, **Then** the fortnight plan still shows that action as selected (with completed status visible).
2. **Given** a prior fortnight with selections that later completed, **When** the lead navigates to that period, **Then** historical selections remain readable without changing the current fortnight.

**Audit mapping**: P1 fortnight completed selections · 001 edge case + FR-010/FR-012

---

### User Story 5 - Settings-driven global shortcut with clear failure (Priority: P2)

The lead’s configured global shortcut accelerator is what the OS registration uses. If registration fails, core capture remains available and status/settings make the failure understandable.

**Why this priority**: Closes FR-014/FR-021 gap where Rust ignored settings.

**Independent Test**: Change accelerator in settings (or seed settings), relaunch/register; confirm OS registration attempt uses that value; simulate denial and confirm in-app capture + status messaging.

**Acceptance Scenarios**:

1. **Given** WorkspaceSettings contains a global shortcut accelerator and enabled flag, **When** the desktop shell registers shortcuts, **Then** it uses that configuration (not a hard-coded key only).
2. **Given** the OS denies or fails registration, **When** the workspace is open, **Then** in-app capture still works and Local-only/capabilities UI indicates shortcut unavailable or failed.
3. **Given** the lead updates the accelerator or enabled flag with an explicit Settings save, **When** that save completes, **Then** LOS re-registers the OS shortcut immediately and success or failure is reflected in status without blocking core workflows (restart not required).

**Audit mapping**: P1 shortcut settings unwired · 001 FR-014, FR-021

---

### User Story 6 - Verification honesty and quality gates (Priority: P2)

Maintainers can run lint/type-check successfully, see task checkboxes and evidence that match reality, and have a written verification path for relaunch persistence, offline core flows, tray, shortcut, and keyboard accessibility.

**Why this priority**: Constitution IX and the audit forbid “done” without evidence; false checkboxes undermine Spec Kit.

**Independent Test**: `pnpm lint` / type-check pass for previously failing packages; evidence doc lists commands/results and unchecked items until verified; 001 tasks.md remediation notes or 002 evidence cross-links without falsely marking unfinished 001 SQLite work.

**Acceptance Scenarios**:

1. **Given** the remediation is complete, **When** maintainers run the documented lint/type-check scripts, **Then** they succeed (including packages that previously failed `rootDir`/tests configuration).
2. **Given** task lists and implementation evidence for foundation work, **When** reviewed after remediation, **Then** no task is marked complete without verification, and overclaimed 001 evidence is corrected or superseded by 002 evidence.
3. **Given** the verification checklist for desktop persistence, offline core, tray, shortcut, and keyboard paths, **When** executed, **Then** results are recorded (pass/fail/skip with reason)—not asserted from compile-only success.

**Audit mapping**: P1 lint fail; P1 overclaimed smoke; P1 tasks over-checked · Constitution VIII–IX · 001 SC-001–007, FR-022

---

### Edge Cases

- App data directory missing or unwritable: fail clearly; do not fall back to silent localStorage as if it were the durable store for packaged desktop.
- Concurrent app instances writing the same DB: document single-writer assumption; prefer fail-safe open over corruption.
- Migration from version N to N+1 fails mid-way: leave DB in a recoverable state (transactional migration runner); never leave a truncated schema presented as healthy.
- Import from legacy JSON/localStorage with wrong application count or missing version: refuse import; leave sources intact.
- Empty fortnight with only completed historical selections: UI must still render those selections.
- Shortcut accelerator invalid: reject or fail registration gracefully with message; do not crash startup.
- Backup restore of a DB from a newer schema than the running app: refuse with clear message; do not partially open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-H01**: Tauri-dev and packaged desktop MUST persist workspace data in SQLite under the documented Tauri application-data directory (not browser localStorage as the durable store). Vite-only preview MAY use clearly labeled non-durable storage and MUST NOT be treated as satisfying desktop relaunch/backup acceptance. *(Audit P0; 001 FR-003; plan R2)*
- **FR-H02**: LOS MUST apply versioned database migrations on startup before serving workspace commands. *(Constitution VII; 001 plan)*
- **FR-H03**: Multi-entity operations that must stay consistent—at minimum daily review upsert with next-action Personal Action create/update—MUST commit or roll back as a single transaction. *(Audit P1; 001 FR-019)*
- **FR-H04**: Corrupt, unreadable, or invalid existing database (or legacy import source) MUST NOT trigger destructive reseed/overwrite of the original bytes; LOS MUST provide a recoverable failure path that preserves the original data. *(Audit P0; 001 FR-017; Constitution VII)*
- **FR-H05**: Backup and restore MUST operate on the live desktop SQLite file; LOS MUST support (a) documented quit-and-replace of that file and (b) in-app Settings restore that targets the same file; automated restore smoke MUST prove a known inbox item returns after restore. *(Audit FR-023 gap; 001 FR-023)*
- **FR-H06**: Documentation (desktop README / settings copy) MUST state the real DB path and both restore paths (quit-and-replace and in-app) matching FR-H01/FR-H05. *(Audit P0 path mismatch)*
- **FR-H07**: Tauri bootstrap MUST open/migrate the SQLite DB and expose command handlers needed for workspace operations (or an equivalent single durable bridge) so the UI does not rely on ephemeral web storage for packaged runs. *(Audit P1 T013–T016/T020 unfinished)*
- **FR-H08**: Fortnight plan views MUST retain and display selected actions after those actions are completed. *(Audit P1; 001 edge case)*
- **FR-H09**: Global shortcut registration MUST use WorkspaceSettings accelerator/enabled values; MUST re-register immediately after an explicit Settings save of those values; and MUST surface registration failure without blocking core capture. *(Audit P1; 001 FR-014/021)*
- **FR-H10**: Repository lint/type-check scripts that failed due to TypeScript project configuration MUST be fixed so `pnpm lint` succeeds for domain and persistence. *(Audit P1)*
- **FR-H11**: Verification evidence MUST cover: persistence across relaunch, offline core workflows, tray behavior, shortcut behavior, and keyboard accessibility—with recorded results. *(Audit P1 unverified SC/US7; 001 FR-022, SC-001–005)*
- **FR-H12**: Task checkboxes and implementation evidence MUST be reconciled with actual code state; work MUST NOT be marked complete without verification. *(Audit P1; Constitution IX)*
- **FR-H13**: This remediation MUST NOT introduce mandatory cloud, account, LLM, Jira, or Confluence requirements. *(Constitution I–IV; 001 FR-016)*
- **FR-H14**: On first open when no SQLite DB file exists, LOS MUST attempt a one-time auto-import from valid legacy localStorage/JSON; MUST show a brief success or failure notice (not silent); MUST NOT import over an existing SQLite DB; failure MUST leave all sources intact. *(Migration risk control)*

### Key Entities

- **Workspace Database File**: The single durable SQLite file for a local installation; location is OS app-data for the LOS desktop app.
- **Schema Migration Record**: Versioned applied migration identity used to advance schema safely.
- **Legacy Import Source**: Optional prior JSON snapshot or localStorage payload from the pre-hardening prototype; not the durable store after hardening.
- **Recoverable Open Failure**: User-visible failure state when DB cannot be opened safely, with original file preserved.
- **Capability Status**: Tray/shortcut availability and registration outcome surfaced in the local-only status UI.

### Traceability to 001 (non-exhaustive)

| 001 criterion | Remediation focus |
|---------------|-------------------|
| FR-003, SC-002 | FR-H01, US1 |
| FR-017 | FR-H04 |
| FR-019, FR-020 | FR-H03, US2 |
| FR-023 | FR-H05–H06, US3 |
| FR-010/012 fortnight edge | FR-H08, US4 |
| FR-014, FR-021 | FR-H09, US5 |
| FR-022, SC-001–007 | FR-H11, US6 |
| Plan SQLite + migrations | FR-H01–H02, FR-H07 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-H01**: In an offline Tauri-dev or packaged run (not Vite-only preview), a newly captured inbox item is still present after quit and relaunch in 100% of verification trials (minimum 3 consecutive trials).
- **SC-H02**: Automated restore smoke against the SQLite file passes: known inbox item returns after backup → mutate → restore.
- **SC-H03**: Injected mid-save failure during daily next-action materialization leaves zero inconsistent half-states in the automated transaction test.
- **SC-H04**: Presenting a corrupt DB file at the documented path never results in silent replacement by an empty seeded DB; original file checksum/size remains unchanged after the failed open attempt.
- **SC-H05**: `pnpm lint` (workspace) completes successfully on the remediation branch.
- **SC-H06**: Fortnight UI shows completed selected actions in 100% of the scripted/manual cases in the verification checklist.
- **SC-H07**: With a denied/failed global shortcut, in-app capture still succeeds and status indicates shortcut failure/unavailability.
- **SC-H08**: Verification evidence document records pass/fail for relaunch persistence, offline core, tray, shortcut, and keyboard paths; no unchecked “claimed pass” without a recorded run.
- **SC-H09**: No Jira, Confluence, or LLM dependency is required to complete any remediation acceptance scenario.

## Assumptions

- Target remains macOS-first for tray/shortcut acceptance; Windows/Linux may follow without changing domain rules.
- Single local user / single writer per DB file.
- Existing 001 domain rules (inbox max length, next-action `lineId` behavior, four application slots, fortnight weekday settings) remain in force; this feature does not reopen those product decisions.
- Vite-only preview may use labeled non-durable storage; durable SQLite and SC-H01/FR-023 acceptance apply to Tauri-dev/packaged only. Docs must not conflate the two.
- One-time legacy auto-import (FR-H14) runs only when SQLite is absent and the source validates, with a visible notice; after a successful SQLite DB exists, production trust is SQLite-only.
- Constitution and `specs/001-foundation-workspace/spec.md` are not edited to weaken requirements; remediation closes gaps instead.
- “Recoverable failure” for corrupt DB may be a blocking error screen with path + backup instructions; full GUI repair wizard is out of scope.
- Unrelated UI redesign and new product features (capacity, sync, AI, integrations) remain out of scope.
