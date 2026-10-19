# Research: Harden Foundation Persistence & Acceptance

**Feature**: `002-harden-foundation`  
**Date**: 2026-10-19  
**Baseline**: `specs/001-foundation-workspace/research.md` (R2 SQLite decision remains binding)

## R1. Persistence technology (remediation)

**Decision**: Replace durable desktop storage with SQLite in the Tauri app-data directory; keep domain ports unchanged; implement repositories against SQLite; retire localStorage as the packaged durable store.

**Rationale**: Matches 001 plan/research R2 and constitution VII; closes audit P0.

**Alternatives considered**: Keep JSON file in app-data (simpler, still no SQL transactions as first-class)—rejected because 001 plan and constitution explicitly require SQLite + versioned migrations. Dual-write localStorage+SQLite—rejected (split brain).

## R2. Migration runner

**Decision**: Versioned SQL migrations applied in a transaction per migration (or equivalent atomic apply+record); schema_migrations (or identical) table tracks versions; startup refuses to serve commands if migrate fails.

**Rationale**: Constitution VII; audit P0.

## R3. Corrupt DB / no silent reseed

**Decision**: Open path validates file; on failure, leave file untouched, surface recoverable error with path and backup guidance. Never call seed-and-overwrite on an existing invalid file. New DB only when file absent.

**Rationale**: Audit P0 silent wipe; FR-H04.

## R4. Legacy data

**Decision**: Optional one-time import when SQLite file absent and legacy JSON/localStorage validates (version + four applications). On any validation failure, skip import and preserve sources. Never import over an existing SQLite file.

**Rationale**: Migration risk for prototype users without destructive overwrite.

## R5. Daily atomicity

**Decision**: `daily.upsert` materialization (action writes + review write) runs inside one SQLite transaction.

**Rationale**: Audit P1; FR-H03.

## R6. Tauri command surface

**Decision**: Bootstrap DB in Rust (path + migrate) and expose invoke handlers that delegate to persistence/app-services boundary as designed in 001 contracts; UI uses invoke in Tauri, not localStorage runtime.

**Rationale**: Audit unfinished T020 / path bootstrap.

## R7. Shortcut registration

**Decision**: Read accelerator/enabled from settings (via command or shared settings row) at register time; emit capability events on failure; keep in-app capture.

**Rationale**: Audit P1; FR-H09.

## R8. Lint

**Decision**: Fix package tsconfigs so tests are typechecked without violating `rootDir` (separate tsconfig for tests or drop rootDir / project references).

**Rationale**: Audit P1 lint failure.

## Migration risks (existing user data)

| Source | Risk | Mitigation |
|--------|------|------------|
| `localStorage` `los-db-v1` | Lost if ignored; wiped if buggy import | Import only when SQLite absent + valid; never delete localStorage on failure |
| JSON `los-db.json` (Node helper path) | Same | Same rules |
| Partial SQLite after failed migrate | Unusable DB | Transactional migrations; refuse start; preserve file |
| User copies “backup” that is only Settings JSON export from localStorage era | Incomplete restore | Docs + Settings must target SQLite file after hardening |

## Out of scope

- Cloud backup, multi-device sync, encryption-at-rest beyond OS file permissions
- Changing 001 product UX beyond fortight completed-selection display and status/shortcut honesty
- Weakening constitution or editing 001 spec to match the incomplete implementation
