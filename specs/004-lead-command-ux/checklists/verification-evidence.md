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

## 003 Track B (not closed by 004)

| Gap | Status |
|-----|--------|
| Soft-gate capacity-row UI hole | Open under 003 |
| Missing field editors (priority/app/deps/actual) | Open under 003 — omitted in 004 UI (FR-U12) |
| FR-C05/C09/C12 | **Not** marked done by restyle |
| `smoke_capacity_planning` when period already closed | Open under 003 |
