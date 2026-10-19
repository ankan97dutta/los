# Implementation evidence — 001-foundation-workspace

**Date**: 2026-10-19  
**Updated**: 2026-10-19 (002 honesty pass — T002)

> **Honesty note**: Rows below reflect what was verified at 001 ship time against the **Vite / MemoryStore / JSON** path. Durable Tauri SQLite (`$APP_DATA/los/los.sqlite`), transactional daily upsert on desktop, and relaunch persistence acceptance are remediated under **`specs/002-harden-foundation/`** — see [002 verification-evidence.md](../../002-harden-foundation/checklists/verification-evidence.md).

## Automated Vitest

```text
pnpm test

@los/domain       — 6 files, 18 tests passed
@los/persistence  — 4 files, 4 tests passed (incl. JSON backup_restore)
@los/app-services — 1 file, 1 test passed
```

## Desktop build

```text
pnpm --filter @los/desktop build  — Vite production build OK
cargo check (apps/desktop/src-tauri) — OK
```

## Dependency scan (T070)

No Jira, Confluence, or LLM packages in root or workspace `package.json` files. Stack: React, Vite, Tauri, Vitest, TypeScript, domain/persistence/app-services only.

## Manual smoke (quickstart 1–8)

| Step | Result | Caveat |
|------|--------|--------|
| 1 Cold start + capture | Pass | **localStorage** persist — not Tauri SQLite (see 002 SC-H01) |
| 2 Triage | Pass | Vite UI |
| 3 Applications | Pass | Seeded MemoryStore |
| 4 Daily autosave | Pass | Debounced UI; **not** SQLite transaction evidence |
| 5 Fortnight | Pass | UI + period tests |
| 6 Monthly | Pass | UI + yearMonth test |
| 7 Tray/shortcut | Compile-time | Runtime OS permission may degrade; settings-driven re-register → 002 |
| 8 Local-only status | Pass | LocalStatus indicator |

Keyboard (FR-022) and SQLite backup/restore (FR-023) → verified under **002** evidence, not claimed complete here.
