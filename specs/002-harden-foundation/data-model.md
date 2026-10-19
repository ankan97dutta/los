# Data Model: Harden Foundation (delta)

**Feature**: `002-harden-foundation`  
**Date**: 2026-10-19  
**Baseline entities**: Unchanged from [001 data-model.md](../001-foundation-workspace/data-model.md) (Application, InboxItem, PersonalAction, DailyReview, DailyNextActionLine, FortnightPlan, MonthlyReview, WorkspaceSettings).

This document adds **persistence/runtime** entities and rules required by hardening. Product field shapes stay as in 001.

## Storage artifact

### WorkspaceDatabaseFile

| Attribute | Rule |
|-----------|------|
| Path | Tauri app-data directory + `los/los.sqlite` (document exact OS path in README) |
| Format | SQLite 3 |
| Create | Only when file absent → migrate + seed (four Applications + default Settings) |
| Corrupt/invalid | Do not delete/overwrite; surface open failure; preserve bytes |
| Single writer | Assumed; second instance should fail safe rather than corrupt |

### SchemaMigration

| Field | Rules |
|-------|--------|
| `version` | Integer PK; monotonic |
| `applied_at` | ISO datetime |

Applied by migration runner before workspace commands.

## Legacy import

### LegacyImportSource

| Source | Validation |
|--------|------------|
| localStorage key `los-db-v1` | JSON snapshot: `version`, exactly 4 applications, required collections |
| Optional JSON file (documented) | Same shape |

**Rules** (FR-H14, clarified):
1. Run only if SQLite file absent.
2. Validate fully before write.
3. On success: create SQLite via migrations, insert imported rows, show success notice.
4. On failure: leave SQLite absent or untouched; leave legacy source intact; show failure notice.
5. Never import over an existing SQLite file.

## Transactional units

| Operation | Must be atomic |
|-----------|----------------|
| `daily.upsert` including next-action PersonalAction create/update + DailyReview/lines | Yes (FR-H03) |
| Single migration apply + version row | Yes |
| Settings update of shortcut fields | Settings persist; shortcut re-register is best-effort after commit (failure → status, not rollback of settings unless implementer chooses otherwise—**default**: persist settings even if OS register fails, surface status) |

## Fortnight selection visibility

`FortnightPlan.selectedActionIds` remains the source of truth. UI/query MUST resolve those IDs to PersonalAction rows **including `status=done`**, showing completed state without removing the selection.

## Backup / restore

| Concept | Rule |
|---------|------|
| Backup | Byte-for-byte (or consistent SQLite backup API) copy of live `los.sqlite` |
| Restore (quit) | Replace file while app quit; relaunch migrates if needed |
| Restore (in-app) | Close DB → replace file → reopen/migrate → reload workspace state |
| Newer schema than app | Refuse open/restore with clear error; do not partially apply |

## Error codes (persistence open)

| Code | Meaning |
|------|---------|
| `DB_OPEN_FAILED` | File exists but unreadable/invalid; bytes preserved |
| `DB_MIGRATE_FAILED` | Migration failed; DB not presented as healthy |
| `LEGACY_IMPORT_FAILED` | Auto-import skipped/failed; notice shown |
| `DB_SCHEMA_TOO_NEW` | Backup/DB newer than app supports |

Workspace command errors from 001 contracts remain unchanged.
