import type { LosDbSnapshot } from './memory_store.js';
import { DbError, type DbSession } from './ports.js';
import { createSqliteRepos } from './sqlite_repos.js';

export function validateLegacySnapshot(data: unknown): data is LosDbSnapshot {
  if (!data || typeof data !== 'object') return false;
  const d = data as LosDbSnapshot;
  if (typeof d.version !== 'number') return false;
  if (!Array.isArray(d.applications) || d.applications.length !== 4) return false;
  if (!Array.isArray(d.inbox) || !Array.isArray(d.actions)) return false;
  if (!Array.isArray(d.daily) || !Array.isArray(d.fortnights) || !Array.isArray(d.monthly))
    return false;
  if (!d.settings) return false;
  return true;
}

/**
 * Import a validated legacy snapshot into an already-migrated empty-ish DB.
 * Caller must ensure SQLite file was absent before create+migrate.
 */
export async function importLegacySnapshot(
  session: DbSession,
  snapshot: LosDbSnapshot,
): Promise<void> {
  if (!validateLegacySnapshot(snapshot)) {
    throw new DbError('LEGACY_IMPORT_FAILED', 'Legacy snapshot failed validation');
  }
  const repos = createSqliteRepos(session);
  await session.withTransaction(async () => {
    // Replace seed applications with imported ones (same slot counts)
    for (const app of snapshot.applications) {
      await session.exec(`DELETE FROM applications WHERE slot_index = ?`, [app.slotIndex]);
      await session.exec(
        `INSERT INTO applications (id, slot_index, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [app.id, app.slotIndex, app.name, app.createdAt, app.updatedAt],
      );
    }
    await repos.settings.save(snapshot.settings);
    for (const item of snapshot.inbox) await repos.inbox.save(item);
    for (const action of snapshot.actions) await repos.actions.save(action);
    for (const review of snapshot.daily) await repos.daily.save(review);
    for (const plan of snapshot.fortnights) await repos.fortnight.save(plan);
    for (const month of snapshot.monthly) await repos.monthly.save(month);
  });
}

export type LegacyImportResult = {
  attempted: boolean;
  imported: boolean;
  notice: string;
};

export async function tryLegacyImport(
  session: DbSession,
  source: unknown | null,
): Promise<LegacyImportResult> {
  if (source == null) {
    return {
      attempted: false,
      imported: false,
      notice: 'No legacy localStorage/JSON source found; started with seeded SQLite.',
    };
  }
  if (!validateLegacySnapshot(source)) {
    return {
      attempted: true,
      imported: false,
      notice: 'Legacy data found but invalid (need version + exactly 4 applications); left intact.',
    };
  }
  try {
    await importLegacySnapshot(session, source);
    return {
      attempted: true,
      imported: true,
      notice: 'Imported workspace data from legacy localStorage/JSON into SQLite.',
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      attempted: true,
      imported: false,
      notice: `Legacy import failed (${message}); sources left intact.`,
    };
  }
}
