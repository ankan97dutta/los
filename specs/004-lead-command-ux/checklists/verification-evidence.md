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

## 003 Track B (not closed by 004)

| Gap | Status |
|-----|--------|
| Soft-gate capacity-row UI hole | Open under 003 |
| Missing field editors (priority/app/deps/actual) | Open under 003 — omitted in 004 UI (FR-U12) |
| FR-C05/C09/C12 | **Not** marked done by restyle |
| `smoke_capacity_planning` when period already closed | Open under 003 |
