# Tasks: GitHub Feedback Button

**Input**: Design documents from `specs/006-github-feedback/`

**Prerequisites**: plan.md, spec.md (5 clarifications 2026-11-07), research.md, data-model.md, contracts/feedback-handoff.md, quickstart.md

**Tests**: Included for pure handoff rules. Plan Technical Context and constitution test-evidence gate require Vitest coverage in `packages/domain/tests/feedback.test.ts`. Desktop component tests remain optional; manual paths are in quickstart.md.

**Organization**: Setup → foundational domain/config/opener → US1 handoff MVP → US2 discoverability → US3 offline degrade → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 / US2 / US3 on story-phase tasks only
- Every task names the file(s) it touches

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Evidence file and opener dependency wiring before behaviour changes

- [ ] T001 Create `specs/006-github-feedback/checklists/verification-evidence.md` with sections for quickstart scenarios A–E and SC-001, SC-003, SC-005, SC-006
- [ ] T002 Add `tauri-plugin-opener` to `[dependencies]` in `apps/desktop/src-tauri/Cargo.toml` and `@tauri-apps/plugin-opener` to `dependencies` in `apps/desktop/package.json`, then run `pnpm install` from the repo root
- [ ] T003 Register the opener plugin in the Tauri builder in `apps/desktop/src-tauri/src/lib.rs` and add opener permissions scoped to `https://github.com/*` in `apps/desktop/src-tauri/capabilities/default.json`

**Checkpoint**: App still builds; existing `pnpm test` green; opener unused

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure draft/URL module, product config, and OS open adapter every story needs

**CRITICAL**: No user story UI work begins until this phase is complete

- [ ] T004 Implement `FeedbackKind` (`bug` | `idea` | `other`), `FeedbackDraft`, `validateFeedbackDraft` with error codes `kind_required`, `title_required`, `description_required` (trim; whitespace-only counts empty), `composeDiagnostics({ appVersion, platform })`, and `buildFeedbackIssueUrl(draft, config)` with 2000-character encoded URL budget and clipboard-fallback fields in `packages/domain/src/feedback.ts`, and export from `packages/domain/src/index.ts` per `contracts/feedback-handoff.md` and `data-model.md`
- [ ] T005 [P] Add Vitest coverage in `packages/domain/tests/feedback.test.ts` for validation, template-prefer vs label fallback, URL encoding, URL length > 2000 triggering `usedClipboardFallback`, and diagnostics composition
- [ ] T006 [P] Add fixed product config `owner` `ankan97dutta`, `repo` `los`, and per-kind `template` (optional string) plus `labels` defaults (`bug`, `enhancement`, `feedback`) in `apps/desktop/src/lib/feedbackConfig.ts`
- [ ] T007 [P] Implement `openFeedbackUrl(url)` returning `{ ok: true } | { ok: false; error: string }` using Tauri opener when available and `window.open` in Vite preview, never throwing, in `apps/desktop/src/lib/feedbackOpen.ts`
- [ ] T008 [P] Add user-facing copy constants (privacy warning, browser-opened confirmation, paste note, open-failed, validation) in `apps/desktop/src/features/feedback/feedbackCopy.ts` — never claim an issue was filed

**Checkpoint**: `pnpm --filter @los/domain test` green; config and open helpers compile; no Settings/palette UI yet

---

## Phase 3: User Story 1 - Send product feedback as a GitHub issue (Priority: P1) MVP

**Goal**: Lead drafts kind/title/description with editable diagnostics, continues after privacy notice, lands on GitHub new-issue with prefill or clipboard paste path, and LOS confirms browser opened only.

**Independent Test**: Quickstart Scenario A (and C for long body) on `tauri:dev`

### Implementation for User Story 1

- [ ] T009 [US1] Build `FeedbackDialog` in `apps/desktop/src/features/feedback/FeedbackDialog.tsx`: required kind Bug/Idea/Other, title, multiline description, privacy notice, Continue/Cancel, Escape/cancel without side effects, keyboard focus trap consistent with `CommandPalette`, accessible names on controls
- [ ] T010 [US1] On dialog open, seed description with `composeDiagnostics` when include-diagnostics default is on so the user can edit/remove lines in the same textarea (`apps/desktop/src/features/feedback/FeedbackDialog.tsx`)
- [ ] T011 [US1] Wire Continue: `validateFeedbackDraft` → `buildFeedbackIssueUrl` with `feedbackConfig` → if `usedClipboardFallback` then `navigator.clipboard.writeText(bodyForClipboard)` → `openFeedbackUrl` → on success close dialog and show short confirmation from `feedbackCopy` (mention paste when fallback); on open failure keep dialog open with error (`FeedbackDialog.tsx` / parent state in `App.tsx` as needed)
- [ ] T012 [US1] Add Settings entry **Send feedback** that opens the same dialog without navigating away permanently, in `apps/desktop/src/features/settings/SettingsPage.tsx` (callback/prop or local state coordinated with `App.tsx`)
- [ ] T013 [US1] Mount dialog state in `apps/desktop/src/App.tsx` so Settings can open it and success/error banners use existing shell patterns (worded, not color-only)

**Checkpoint**: From Settings, Bug + short text opens GitHub; confirmation never says issue filed; long body uses clipboard path

---

## Phase 4: User Story 2 - Find Feedback without disrupting daily work (Priority: P2)

**Goal**: Feedback discoverable from Settings and command palette only; dismiss leaves prior route and unsaved work intact; no sidebar/footer Feedback control.

**Independent Test**: Quickstart Scenario B

### Implementation for User Story 2

- [ ] T014 [US2] Extend `PaletteAction` with `run: 'feedback'`, add `{ id: 'send-feedback', label: 'Send feedback', group: 'Capture', run: 'feedback' }` to `DEFAULT_PALETTE_ACTIONS` in `apps/desktop/src/shell/CommandPalette.tsx`
- [ ] T015 [US2] Handle `run: 'feedback'` in `apps/desktop/src/App.tsx` to open the same `FeedbackDialog` as Settings; ensure Escape/cancel restores focus without route change or durable data writes
- [ ] T016 [P] [US2] Confirm no always-visible shell Feedback control was added in `apps/desktop/src/shell/AppShell.tsx` (explicit non-change / review note in verification evidence if unchanged)

**Checkpoint**: Palette search `feedback` opens identical flow; cancel leaves Today edits intact

---

## Phase 5: User Story 3 - Stay productive when GitHub is unreachable (Priority: P3)

**Goal**: Failed continue shows clear non-blocking error, draft remains for copy/retry, core navigation stays usable.

**Independent Test**: Quickstart Scenario D

### Implementation for User Story 3

- [ ] T017 [US3] On `openFeedbackUrl` failure, keep `FeedbackDialog` open, show `feedbackCopy` open-failed message, and provide **Copy draft** (title + kind + description via clipboard) in `apps/desktop/src/features/feedback/FeedbackDialog.tsx`
- [ ] T018 [US3] Verify and harden preview popup-blocked path in `apps/desktop/src/lib/feedbackOpen.ts` so blocked `window.open` returns `{ ok: false }` rather than success
- [ ] T019 [US3] Manually run Scenario D (offline or blocked open), then complete a Today next-action edit; record result in `specs/006-github-feedback/checklists/verification-evidence.md`

**Checkpoint**: Failure does not freeze shell; draft copy works; Today still editable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, docs, and release hygiene

- [ ] T020 Run quickstart scenarios A–E (Tauri-dev for A/C; D as applicable), fix gaps, and fill `specs/006-github-feedback/checklists/verification-evidence.md`
- [ ] T021 [P] Add a short **Feedback** subsection under Releases or Settings-adjacent notes in `README.md` pointing to in-app Send feedback → GitHub Issues (optional; skip if README already sufficient)
- [ ] T022 [P] Ensure official `.github/ISSUE_TEMPLATE` stubs or document empty `template` strings in `apps/desktop/src/lib/feedbackConfig.ts` comments so label fallback remains intentional until templates exist
- [ ] T023 Run `pnpm --filter @los/domain test`, `pnpm --filter @los/desktop lint`, and a Tauri-dev smoke open of Feedback

**Checkpoint**: Feature ready for PR; constitution gates for privacy/offline/desktop UX satisfied with evidence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → no deps
- **Phase 2 Foundational** → after Setup; **blocks** all stories
- **Phase 3 US1** → after Foundational (MVP)
- **Phase 4 US2** → after US1 dialog exists (reuses dialog)
- **Phase 5 US3** → after US1 continue path exists
- **Phase 6 Polish** → after desired stories complete

### User Story Dependencies

- **US1**: Only foundational — MVP
- **US2**: Depends on US1 dialog mount (same component)
- **US3**: Depends on US1 continue/open path

### Parallel Opportunities

- T005, T006, T007, T008 after T004 (or T006–T008 parallel with T005 once T004 done)
- T014–T016 after dialog exists; T016 independent review
- T021 / T022 in polish can run in parallel

---

## Parallel Example: Foundational

```bash
# After T004:
Task: "T005 feedback.test.ts"
Task: "T006 feedbackConfig.ts"
Task: "T007 feedbackOpen.ts"
Task: "T008 feedbackCopy.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2  
2. Phase 3 (Settings → dialog → GitHub handoff)  
3. Stop and validate Scenario A (+ C)

### Incremental Delivery

1. MVP (US1)  
2. Palette entry (US2)  
3. Offline/copy degrade (US3)  
4. Polish + evidence  

---

## Notes

- No SQLite migration; no GitHub tokens; no sidebar Feedback control  
- Template path: prefer configured template query; v1 may clipboard body for forms per contract  
- Commit after each phase or logical group  
- Next after tasks: `/speckit-analyze` or `/speckit-implement`
