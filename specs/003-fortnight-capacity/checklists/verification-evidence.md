# Verification Evidence: 003 Fortnight Capacity Planning

**Rule**: Do not mark tasks `[X]` without a command row or smoke note here.

## Commands

| Date | Task | Command / action | Result |
|------|------|------------------|--------|
| 2026-10-19 | T004/T006 | `pnpm --filter @los/domain test` | 29 passed (incl. capacity + planning_work) |
| 2026-10-19 | T010 | `pnpm --filter @los/persistence test` | 12 passed (incl. capacity_migrate; migratedTo=2) |
| 2026-10-19 | T013/T019/T023/T024/T030/T031 | `pnpm --filter @los/app-services test` | 14 passed (capacity, warnings, assignee, close, carry-forward) |
| 2026-10-19 | T040 | `pnpm --filter @los/persistence test` — `backup_restore.test.ts` | Pass (002 backup path still green with schema v2) |
| 2026-10-19 | T042/T043 | `pnpm test && pnpm lint && pnpm --filter @los/desktop build` + `cargo check` | All green |

## Smokes

| Date | SC / Task | Notes |
|------|-----------|-------|
| 2026-10-19 | SC-C01 | Automated domain capacity tests |
| 2026-10-19 | SC-C03 | Automated soft-gate allocate + planConflicted |
| 2026-10-19 | SC-C04/SC-C08 | Automated close snapshot + carry-forward + auto next period |
| | SC-C02 relaunch ×3 (T018/T036) | **Pending** interactive Tauri quit/relaunch |
| | SC-C05/C06 timed + keyboard (T038/T039) | **Pending** interactive |
| | SC-C07 offline (T037) | **Pending** airplane-mode confirm (no Jira/LLM in code path) |
| | UI smokes T016/T022/T029/T035 | **Pending** Capacity nav in Tauri |
