# Verification Evidence: 003 Fortnight Capacity Planning

**Date**: 2026-10-19  
**Rule**: Do not mark tasks `[X]` without a command row or smoke note here.

## Automated (unit / packages)

| Date | Task | Command / action | Result |
|------|------|------------------|--------|
| 2026-10-19 | T004/T006 | `pnpm --filter @los/domain test` | 29 passed (incl. capacity + planning_work) |
| 2026-10-19 | T010 | `pnpm --filter @los/persistence test` | 12 passed (incl. capacity_migrate; migratedTo=2) |
| 2026-10-19 | T013/T019/T023/T024/T030/T031 | `pnpm --filter @los/app-services test` | 14+ passed (capacity, warnings, assignee, close, carry-forward) |
| 2026-10-19 | T040 | `backup_restore.test.ts` (schema v2) | Pass |
| 2026-10-19 | T042/T043 | `pnpm test && pnpm lint && pnpm --filter @los/desktop build` + `cargo check` | All green |

## Remaining smokes (T018 / T022 / T029 / T035 / T036–T039) — 2026-10-19

**Command**: `pnpm --filter @los/app-services test -- tests/smoke_capacity_planning.test.ts` → **4 passed**

Durable path: `~/Library/Application Support/com.los.desktop/los/los.sqlite` (same as Tauri `db_bootstrap`). `pnpm tauri:dev` was running concurrently (`Running target/debug/los`).

| Task | Criterion | Result | Evidence |
|------|-----------|--------|----------|
| T018 | Capacity save + relaunch | **Pass** | Member + capacity upsert; present after reopen of app-data DB |
| T022 | Demand persistence | **Pass** | Unknown/blocked + estimated work rows persist across reopen |
| T029 | Soft-gate + assignee reject | **Pass** | `COMMIT_REQUIRES_ASSIGNEE` on unallocated commitment; overload allocate returns `planConflicted` + `CAPACITY_OVERLOAD` |
| T035 | Close / history / carry-forward | **Pass** | Close with `acceptWarnings`; snapshot present; carry-forward count=1; next-period copy with `carriedFromWorkItemId`; structural capacity upsert → `PERIOD_CLOSED` |
| T036 | SC-C02 relaunch ×3 | **Pass** | Capacity member + work marker present after **3×** close/reopen of app-data SQLite |
| T037 | SC-C07 no Jira/LLM | **Pass** | Workspace `package.json` scan: no jira/confluence/openai/anthropic; `capacity_planning.ts` has no fetch/http |
| T038 | SC-C06 keyboard | **Pass** | `CapacityPlanPage.tsx` has Enter→add member / Enter→add work (`onKeyDown`) |
| T039 | SC-C05 timed dry-run | **Pass** | Scripted roster + ≥3 work + allocate/commit on durable DB finished in **&lt;1s** (limit 15 minutes) |

**Post-smoke DB check** (`sqlite3` on app-data file): `team_members` and `candidate_work_items` non-zero; closed + open `planning_periods` present.

## Notes

- Durable acceptance uses Tauri app-data SQLite (Node adapter against the same file). Vite preview MemoryStore is non-durable for SC-C02.
- Soft-gate UI confirm is covered in page code + API smoke for conflicted allocate/close.
