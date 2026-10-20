# Verification Evidence: 004 Lead Command UX

**Branch**: `feature/005-lead-command-ux`  
**Constitution**: v1.1.0 applied (`.specify/memory/constitution.md`)  
**Date**: 2026-10-19  
**Runtime for UI smokes**: Vite preview `http://localhost:1420/` (localStorage — not SC-H01). Shell/IA/theme/palette/Planning honesty verified here; durable SQLite remains `pnpm tauri:dev`.

## Governance

| Item | Result | Notes |
|------|--------|-------|
| Constitution v1.1.0 applied | PASS | Principle X + Desktop UX gate expanded |
| Feature complete gate | PASS | T058 — Desktop UX rows below recorded; 003 Track B gaps remain explicitly open |

## Automated

| Check | Result | Notes |
|-------|--------|-------|
| `pnpm test` | PARTIAL | Domain 29/29 pass; app-services unit tests pass; `smoke_capacity_planning` T018 flake when current fortnight already closed (003 Track B — not introduced by 004) |
| `pnpm lint` | PASS | Fixed unused `readdirSync` in 003 smoke test |
| `pnpm --filter @los/desktop build` | PASS | vite production build OK |

## Scripted UI (Vite preview 2026-10-19)

| SC / FR | Result | Notes |
|---------|--------|-------|
| Shell nav Today/Inbox/Planning/Team/Reviews/Settings | PASS | Primary nav present; each route opens expected host (T025) |
| Inbox → Actions secondary | PASS | Inbox sections: Inbox \| Actions; Actions shows Personal actions empty/create (T025) |
| Team Roster \| Applications | PASS | Team sections sub-nav; Roster + Applications hosts (T025) |
| Reviews Monthly \| Planning history | PASS | Reviews sections: Monthly + Planning history (T025) |
| SC-U01 keyboard Inbox→Planning ×3 | PASS | 3/3 via Ctrl/Meta+K → Inbox capture (`#inbox-capture` Enter) → palette → Planning; items `SC-U01 keyboard trial 1–3` listed (T053) |
| SC-U02 conflicted text after soft-gate | PASS | Commitment on unknown estimate → banner “Conflicted” + “Plan remains conflicted until…”; soft-gate confirm used (T038) |
| SC-U03 unknown ≠ 0 | PASS | Demand shows **Unknown estimate** status cue (not `0h`) for Spike unknown (T038) |
| SC-U04 theme ×3 + contrast spot-check (body/muted/status × dark/light) | PASS | Theme trials: dark→light→dark→light (Settings select); drafts not wiped. Manual contrast: **light** Planning body dark on pale blue-white, muted secondary, Open/Clean/Conflicted cues readable; **dark** Inbox body `#e8eef4` on graphite, muted `#8b9aab`, Capture primary + Dismiss danger cue readable (T031) |
| SC-U05 palette → Planning &lt;5s | PASS | Timed palette filter→Planning ~287ms ×3 (&lt;5s) (T048) |
| Closed period read-only presentation | PASS | After close: “Closed — structure frozen”, assignee/kind/status frozen, capacity `.readonly-field` ×4, no Add work (T038) |
| Close/restore still confirmable | PASS | Close period: `window.confirm` for warnings; Settings weekday change: confirm “Change fortnight start weekday…” (cancel path verified). File restore remains Tauri-path gated (T043) |
| FR-U13 window default/min | PASS | `tauri.conf.json` 1200×800, min 1024×680 (T051) |
| Shortcut-deny in-app capture | PASS | LocalStatus `Shortcut: unavailable` in Vite preview; in-app Inbox capture still succeeded (SC-U01 trials) — 002 degrade preserved (T052) |
| Save / empty / error / local-status | PASS | Notes save → “Saved”; empty Inbox EmptyState before captures; conflicted allocate sets conflict banner; chrome shows Tray/Shortcut/DB local status (T044) |

## FR-U14 / SC-U08 LocalStatus capability phrases (T089–T098, 2026-10-20)

| Check | Result | Notes |
|-------|--------|-------|
| Vite preview phrases | PASS | `capabilityPhrases.ts` + `LocalStatus.tsx`: when `!window.__TAURI__`, lines are exactly `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)` (SC-U08) |
| Tauri registration-failed | PASS | When shortcut not registered / error set: `Shortcut: unavailable (registration failed)` (+ optional error); tray false → `Tray: unavailable (OS)` |
| Settings ownership | PASS | Shortcuts group has short Tauri-only note; does **not** duplicate FR-U14 phrases (clarify B) |
| In-app capture when shortcut unavailable | PASS | Unchanged 002 path — Inbox capture does not require OS shortcut (SC-H07) |
| `pnpm lint` + desktop build | PASS | Recorded with T097 run |
| FR-U14 complete-gate | PASS | T098 |

## Convergence: shortcut registration fix (T099–T103, 2026-10-20)

| Check | Result | Notes |
|-------|--------|-------|
| Root cause | CONFIRMED | `shortcuts.rs` called `on_shortcut()` (which already registers the hotkey) **and** `.register()` again — the second registration always failed (`RegisterEventHotKey failed for KeyL`), flipping state to `registered=false`. Plus `parse_accel` substring matching turned `Cmd+Shift+L` into `Cmd+Ctrl+Shift+L`, and frontend status was a frozen boot snapshot. |
| T099 double-registration removed | PASS | `on_shortcut` success now sets `registered=true`, cleared error |
| T100 token-based parsing | PASS | `cargo test shortcuts`: 5/5 (CommandOrControl / Cmd / Ctrl / alias / rejects) |
| T101 live Rust status | PASS | Boot seeds from `workspace_status`; `LocalStatus` re-invokes `workspace_status` in Tauri |
| T102 persisted settings at startup | PASS | Post-boot re-register with saved accel/enabled from `WorkspaceSettings` |
| `tauri:dev` startup log | PASS | Single clean instance: `Running target/debug/los` with **no** `Global shortcut registration failed` line (previously appeared immediately) |
| Global hotkey opens Quick Capture | MANUAL | Agent could not synthesize `Cmd+Shift+L` (macOS Accessibility permission blocks `osascript`). Verify manually in the running app. |
| In-app capture when shortcut fails | PASS | Unchanged 002 path; Inbox capture does not depend on OS shortcut |
| `pnpm lint` + desktop build | PASS | lint OK; vite build OK |

## Modern minimalism polish (T059–T088, 2026-10-19)

| Check | Result | Notes |
|-------|--------|-------|
| Density tokens (`--sidebar-width`, `--content-max`, `--motion-fast`) | PASS | `tokens.css` (T059) |
| Quiet flat background (no accent radial wash) | PASS | `base.css` single-plane `--bg` (T060) |
| Divider list chrome vs stacked cards | PASS | `.list li` hairline dividers; Planning demand uses `.list` not `.card` (T061/T072) |
| Slim shell + LocalStatus footer | PASS | 200px sidebar; brand “LOS / Local-first”; status text footer (T063–T065) |
| SurfaceLayout (one h1 + lede) | PASS | Inbox, Planning, Settings, Reviews hosts, Daily/Fortnight (T066–T068, T076) |
| EmptyState single next action | PASS | Inbox / demand / actions / daily hints tightened (T074) |
| Settings pref-groups (no card grid) | PASS | Appearance / Planning / Shortcuts / Backup groups (T075) |
| Palette + route motion ≤ `--motion-fast` | PASS | CSS animations + `.main-fade` on route key; reduced-motion respected (T078–T079) |
| SC-U04 recheck after token change | PASS | Dark graphite body/muted/status cues remain text+dot via StatusCue; light theme tokens unchanged structurally (T070) |
| Honesty floor (conflict/unknown/save/closed) | PASS | StatusCue/Banner/SaveIndicator retained; no fake 003 editors (T073/T087) |
| Focus-visible + primary nav names | PASS | `:focus-visible` rings; `nav aria-label="Primary"` unchanged (T081) |
| `pnpm lint` + desktop build | PASS | lint OK; vite production build OK (T086) |
| Domain / unit regression (SC-U07) | PASS | domain 29/29; persistence 12/12; app-services unit (excl. known Track B smoke) pass |
| Full `pnpm test` | PARTIAL | Same 003 Track B: `smoke_capacity_planning` fails when current fortnight already closed — not introduced by polish |
| Desktop UX complete-gate refresh | PASS | T088 — modern-minimal rows above; constitution v1.1.0 still applied |

## Premium command-center refresh (Phase 22, T104–T111, 2026-10-20)

Plan: `design-refresh-2026-10-20.md`. No domain/SQLite changes.

| Check | Result | Notes |
|-------|--------|-------|
| Shell: grouped Workspace/System nav, ⌘1–6 hints + nav, Inbox count, contextual header, Quick Capture + ⌘K, default route = Today | PASS | Vite preview snapshot: Inbox badge `3`; header actions present; FR-U14 phrases unchanged |
| Today brief (Move forward / Blockers / Decisions & follow-ups / Outcomes on existing Daily fields + autosave) | PASS | Vite preview snapshot; SaveIndicator retained |
| Planning summary Net/Committed/Remaining/Unallocated/Unestimated (service totals) | PASS | Closed fixture: 36h / 0h / 36h / 0 / 1 rendered tabular |
| Workload bars, over/zero-capacity text, actionable warnings (`Review →`) | PASS | Fixture warning selects affected item; overload/zero paths unit-tested in `planningView.test.ts` (4/4) |
| Detail panel: priority/estimate/Unknown/actual/application/dependency/status/assignee/kind; committed ● vs stretch ○; closed read-only `<dl>` | PASS | Panel verified at 1440px (340px, right column); closed fixture opens read-only |
| Inline close review (counts, carry-forward, separate trade-off/outcome/carryover, ack checkbox) | PASS (code) | Replaces `window.confirm` close + fixes carryover=tradeoff conflation; not exercised end-to-end on an open fixture in preview (preview fixture period is closed) |
| `pnpm --filter @los/desktop test` (new) | PASS | 4/4 planningView tests |
| `pnpm lint`, desktop `tsc+vite build`, `cargo check` | PASS | Build 495ms; cargo check clean |
| Domain/persistence tests | PASS | 29/29, 12/12 |
| Full `pnpm test` | PARTIAL (pre-existing) | `@los/app-services` smoke failures (`database is locked`, closed-period smoke) reproduce on a clean tree via `git stash` — not introduced by Phase 22 |
| Tauri runtime smoke | NOT RUN | Vite preview only this session; global-shortcut/manual Tauri checks from T103 stand |

**Correction to Track B below**: priority/app/dependency/actual editors are now
wired in the detail panel because the service already supported them. Formal
003 FR-C05/C09/C12 acceptance sign-off still belongs to 003 verification.

## 003 Track B (remaining)

| Gap | Status |
|-----|--------|
| Soft-gate capacity-row UI hole | Detail panel now requires explicit confirm for conflicted commitments; formal 003 sign-off open |
| Missing field editors (priority/app/deps/actual) | **UI wired in Phase 22** (service already supported); 003 acceptance sign-off open |
| FR-C05/C09/C12 | **Not** marked done by 004 — needs 003 verification pass |
| `smoke_capacity_planning` when period already closed | Open under 003 (pre-existing) |

## Phase 23 (T112–T116, 2026-10-20)

| Check | Result | Notes |
|-------|--------|-------|
| Weekly planning | PASS | Domain week tests (7d, ±7 nav); Planning UI shows Weekly planning / Prev–Next week; Vite preview opened a fresh open week |
| Inbox Keep | PASS | Live preview: triage 3→2, Kept 0→1, announcement shown, Return restored flow; domain + service tests; migration v3 (APP_MAX 3) |
| Reset all data | PASS (service) | `workspaceResetAll` test: inbox wiped, 4 default apps reseeded; UI has export-first + inline Esc confirm. Not clicked live (would wipe preview data) |
| Team/Applications | PASS (code) | Roster rename/deactivate/reactivate; Applications rename/reset-name; Esc cancels |
| Keyboard | PASS | Live: `?` opens focused Shortcuts dialog, Esc closes; arrows in nav/tabs/rows; zero `window.confirm` in desktop src |
| Regression | PASS | `pnpm test` all green (domain 31, persistence 12, app-services 20, desktop 4); `pnpm lint` 0 errors; desktop build + `cargo check` PASS |

## 2026-10-20 (Phase 24 — saves/reset, Threads, tour, tray, logo)

| Check | Result | Evidence |
|---|---|---|
| Full tests | PASS | domain 31, persistence 12, app-services 23 (incl. new thread/member remove tests), desktop 4 |
| Desktop build + lint + cargo check | PASS | `pnpm --filter @los/desktop build`, lint 0 errors, `cargo check` clean |
| Live DB migration | PASS | Running dev app migrated the real app-data DB to schema version 4; threads table readable |
| Smoke-test isolation | PASS | App-data smoke tests now use `tmpdir()/los-smoke/los.sqlite`; real DB cleaned of smoke artifacts (backup at /tmp/los-real-backup-before-clean.sqlite) |
| Tauri saves end-to-end (click → restart → persists) | PARTIAL | Service layer verified against a DB copy; live click-through requires the user's desktop session — verify with one capture after relaunch |
| Tray icon visible in menu bar | PARTIAL | Root cause fixed (no `.icon()` was set); visual confirmation needs the user's menu bar |

