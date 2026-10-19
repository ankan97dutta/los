# Verification evidence — 002-harden-foundation

**Date**: 2026-10-19  
**Rule**: Only record results that were actually run.

## Automated

| Check | Command | Result |
|-------|---------|--------|
| Unit/integration | `pnpm test` | Pass — domain 18, persistence 11, app-services (+ smoke) |
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

## Remaining smokes (T025 / T041 / T042 / T044) — 2026-10-19

**Command**: `pnpm --filter @los/app-services test -- tests/smoke_tauri_appdata.test.ts` → **4 passed**

| Task | Criterion | Result | Evidence |
|------|-----------|--------|----------|
| T042 | Offline core | **Pass** | Capture → triage keep → list on local SQLite only (no network APIs) |
| T025 | SC-H01 relaunch ×3 | **Pass** | Item present after **3×** close/reopen of `~/Library/Application Support/com.los.desktop/los/los.sqlite` (same path as Tauri `db_bootstrap`) |
| T041 | SC-H07 shortcut deny | **Pass** | In-app capture succeeds with `globalShortcutRegistered=false` + error; **also** live `pnpm tauri:dev` logged `Global shortcut registration failed gracefully: Unable to register hotkey: RegisterEventHotKey failed for KeyL` |
| T044 | FR-022 keyboard | **Pass** | Inbox + QuickCapture implement Enter→`requestSubmit` and Inbox documents Tab/Enter |

**Tauri-dev confirmation**: `pnpm tauri:dev` reached `Running target/debug/los`; app-data `los.sqlite` present (94KB). After process quit, `sqlite3` still showed the SC-H01 inbox marker (`count=1`).

## Manual / other

| Criterion | Status | Notes |
|-----------|--------|-------|
| SC-H04 UI | Vitest + `DbOpenError` wired | Optional interactive corrupt-file UI |
| SC-H06 UI | Automated selection test pass | Fortnight page shows “done” |
| Tray open + quick capture | **Skipped** | No interactive tray automation in agent session (OS/environment) |

## Runtime composition note

Durable acceptance applies to **Tauri-dev/packaged** SQLite only. Vite preview uses labeled non-durable `localStorage`.
