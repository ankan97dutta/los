# Verification evidence — 002-harden-foundation

**Date**: 2026-10-19  
**Rule**: Only record results that were actually run.

## Automated

| Check | Command | Result |
|-------|---------|--------|
| Unit/integration | `pnpm test` | Pass — domain 18, persistence 11, app-services 2 |
| Lint | `pnpm lint` | Pass — domain, persistence, app-services, desktop `tsc` |
| Desktop Vite build | `pnpm --filter @los/desktop build` | Pass |
| Rust | `cargo check` in `apps/desktop/src-tauri` | Pass |
| SC-H02 restore smoke | `packages/persistence/tests/backup_restore.test.ts` | Pass |
| SC-H03 transaction | `packages/persistence/tests/daily_transaction.test.ts` | Pass |
| SC-H04 corrupt open | `packages/persistence/tests/corrupt_open.test.ts` | Pass |
| SC-H05 lint | `pnpm lint` | Pass |
| Schema too new | `packages/persistence/tests/schema_too_new.test.ts` | Pass |
| Fortnight done selections | `packages/app-services/tests/fortnight_selections.test.ts` | Pass |
| SC-H09 deps | scanned `package.json` / workspace packages | No Jira/Confluence/LLM runtime deps |

## Manual / Tauri-dev

| Criterion | Status | Notes |
|-----------|--------|-------|
| SC-H01 relaunch ×3 | **Pending** | Operator: `pnpm tauri:dev`, capture → quit → relaunch ×3 |
| SC-H04 UI | Vitest + `DbOpenError` wired | Optional interactive corrupt-file UI |
| SC-H06 | Automated selection test pass | Confirm Fortnight UI shows “done” in Tauri |
| SC-H07 shortcut deny | **Pending** | Operator: deny OS permission; in-app capture + status |
| Offline core | **Pending** | Operator airplane-mode smoke |
| Tray open + quick capture | **Skipped** | No interactive display/tray in agent session (OS/environment) |
| Keyboard FR-022 | **Pending** | Operator Tab/Enter path |

## Runtime composition note

Durable acceptance applies to **Tauri-dev/packaged** SQLite only. Vite preview uses labeled non-durable `localStorage`.
