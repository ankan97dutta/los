# Quickstart Validation: Foundational LOS Desktop Workspace

**Feature**: `001-foundation-workspace`  
**Purpose**: Runnable validation guide after implementation (not a substitute for `tasks.md`).

## Prerequisites

- macOS development machine
- Node.js + Rust toolchain suitable for Tauri 2
- Network **disabled** (or airplane mode) for offline acceptance scenarios
- Feature branch `feature/001-foundation-workspace`

## Setup

```bash
export PATH="$HOME/.local/bin:$PATH"
pnpm install
pnpm test
pnpm --filter @los/desktop dev        # UI (localStorage DB)
pnpm --filter @los/desktop tauri:dev  # full shell when validating tray/shortcut
```

Database: see `apps/desktop/README.md` (`los-db-v1` / `$APP_DATA/los/los-db.json`).

## Automated checks

```bash
pnpm --filter @los/domain test
pnpm --filter @los/persistence test
pnpm --filter @los/app-services test
```

Must cover at least:

- Fortnight period math (Monday default; ±14 navigation; stable within period)
- Inbox capture validation (empty / too long)
- Triage convert/dismiss/keep
- Daily next-action materialization idempotence (`lineId`)
- Application seed count = 4
- Backup/restore file smoke (`backup_restore.test.ts`)

## Manual desktop smoke (offline)

1. **Cold start + capture (SC-001, P1)** — Launch offline; capture “Smoke request”; quit/relaunch → present.
2. **Triage (P2)** — Convert / dismiss / keep behaviors.
3. **Applications (P3, SC-006)** — Application 1–4; rename; link/unlink action.
4. **Daily review autosave (P4, FR-019/020)** — unsaved → saving → saved; no duplicate next-actions.
5. **Fortnight (P5)** — select actions; commitments; prev/next.
6. **Monthly (P6)** — priorities persist across relaunch.
7. **Tray + shortcut (P7, FR-014/021)** — tray open + quick capture; shortcut or graceful degrade; in-app capture still works.
8. **Local-only status (FR-015)** — Local only indicator; no Jira/Confluence/LLM prompts.
9. **Keyboard path (FR-022)** — Tab/Enter capture → triage → actions.
10. **Backup / restore (FR-023)** — Export/copy DB → mutate → restore → item returns (or run persistence backup test).

## Evidence

See `specs/001-foundation-workspace/checklists/implementation-evidence.md`.

## References

- Spec: [spec.md](./spec.md)  
- Data model: [data-model.md](./data-model.md)  
- Commands: [contracts/workspace-commands.md](./contracts/workspace-commands.md)  
- Queries: [contracts/workspace-queries.md](./contracts/workspace-queries.md)
