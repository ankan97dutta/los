# Quickstart Validation: 004 Lead Command UX

**Purpose**: Validate after implementation / polish (not a substitute for `tasks.md`).  
**Prereq**: Constitution v1.1.0 applied; git branch `feature/005-lead-command-ux`; feature dir `specs/004-lead-command-ux`.

## Setup

```bash
export PATH="$HOME/.local/bin:$PATH:$HOME/.cargo/bin"
pnpm install
pnpm test   # must keep 001/003 domain + capacity unit tests green
pnpm --filter @los/desktop tauri:dev
# or: pnpm --filter @los/desktop dev  # Vite preview — expect FR-U14 preview phrases
```

## Checks

1. **Shell** — Primary nav: Today / Inbox / Planning / Team / Reviews / Settings; Local status visible; chrome feels slim (no stat strip / promo clutter).
2. **Inbox secondary** — Inbox → Actions sub-nav opens Personal Actions (not a seventh primary item).
3. **Team / Reviews** — Team: Roster \| Applications; Reviews: Monthly \| Planning history.
4. **Theme** — Settings theme dark↔light; preference survives reload (`los.ui.theme`); SC-U04 contrast spot-check notes in verification-evidence.
5. **SC-U01** — Keyboard: Inbox capture → Planning (no pointer) ×3.
6. **SC-U02/U03** — Conflicted + unknown estimate: text labels; unknown ≠ `0`.
7. **Closed period** — Frozen fields read-only presentation (non-focusable); notes/history still usable.
8. **SC-U05** — Command palette (`Meta+K` / `Ctrl+K`) → Planning under 5s; open/close motion is short and quiet.
9. **SC-U06/U07** — No Jira/LLM; `pnpm test` green.
10. **Window** — Default 1200×800, min 1024×680; primary actions usable at minimum.
11. **Modern minimal** — Primary surfaces show one title + short lede; list chrome uses dividers/spacing more than stacked cards; conflict/error/save cues still text-visible; no purple/glow aesthetic.
12. **SC-U08 / FR-U14** — Vite (`pnpm --filter @los/desktop dev`): LocalStatus shows exactly `Tray: n/a (browser preview)` and `Shortcut: n/a (browser preview)`. Tauri with failed shortcut: `Shortcut: unavailable (registration failed)` (+ optional error); in-app capture still works. Settings does **not** duplicate those FR-U14 lines (short Tauri-only note OK).

## Evidence

Record in `checklists/verification-evidence.md`. Do not mark 003 FR-C05/C09/C12 complete via restyle alone.
