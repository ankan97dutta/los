# Quickstart Validation: Foundational LOS Desktop Workspace

**Feature**: `001-foundation-workspace`  
**Purpose**: Runnable validation guide after implementation (not a substitute for `tasks.md`).

## Prerequisites

- macOS development machine
- Node.js + Rust toolchain suitable for Tauri 2 (versions pinned in repo when scaffolded)
- Network **disabled** (or airplane mode) for offline acceptance scenarios
- Feature branch `feature/001-foundation-workspace`

## Setup (once implementation exists)

```bash
# From repo root — exact package scripts to be added during implement
pnpm install
pnpm --filter @los/domain test
pnpm --filter @los/persistence test
pnpm --filter desktop tauri dev
```

Database file location: OS app data directory for the LOS app (document exact path in README during implement). Migrations run on first launch.

## Automated checks (domain)

```bash
pnpm --filter @los/domain test
```

Must cover at least:
- Fortnight period math (Monday default; ±14 navigation; timezone fixture)
- Inbox capture validation (empty / too long)
- Triage convert/dismiss/keep
- Daily next-action materialization idempotence (`lineId`)
- Application seed count = 4

## Manual desktop smoke (offline)

1. **Cold start + capture (SC-001, P1)**  
   - Launch app with network off.  
   - Capture inbox item “Smoke request”.  
   - Quit and relaunch offline → item still present.

2. **Triage (P2)**  
   - Convert one item → appears as open Personal Action.  
   - Dismiss another → gone from open inbox.  
   - Keep one → remains open.

3. **Applications (P3, SC-006)**  
   - Confirm Application 1–4 exist.  
   - Rename one; link an action; clear link.

4. **Daily review autosave (P4, FR-019/020)**  
   - Edit outcomes/blockers/follow-ups/next actions.  
   - Observe unsaved → saving → saved.  
   - Confirm next-action lines created Personal Actions once; edit again without duplicates.

5. **Fortnight (P5)**  
   - Open current fortnight; select actions; add commitment; autosave.  
   - Navigate to previous fortnight; current data unchanged.

6. **Monthly (P6)**  
   - Record improvement priorities; relaunch; still present.

7. **Tray + shortcut (P7, FR-014/021)**  
   - Tray: open window; quick capture.  
   - Global shortcut (if registered): quick capture.  
   - If shortcut denied: in-app capture still works; status indicates local/degraded shortcut.

8. **Local-only status (FR-015)**  
   - UI indicates local-only; no prompt requiring Jira/Confluence/LLM.

9. **Keyboard path (FR-022)**  
   - With pointer unused, Tab/Enter through: capture inbox item → open triage → open actions (smoke).

10. **Backup / restore (FR-023)**  
   - Note DB path from README.  
   - Create a known inbox item; copy DB file aside; delete/change item; restore DB file; relaunch and confirm known item returns.  
   - Or run `packages/persistence/tests/backup_restore.test.ts` / `scripts/smoke-backup-restore.sh`.

## Evidence to attach for “done”

- Vitest output (domain + persistence)  
- Notes or screenshots for manual smoke steps 1–8  
- Confirmation migrations applied (version table / log)

## References

- Spec: [spec.md](./spec.md)  
- Data model: [data-model.md](./data-model.md)  
- Commands: [contracts/workspace-commands.md](./contracts/workspace-commands.md)  
- Queries: [contracts/workspace-queries.md](./contracts/workspace-queries.md)
