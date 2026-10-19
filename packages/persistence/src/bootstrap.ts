import { migrate } from './migrate.js'; // Node fs-backed
import { tryLegacyImport, type LegacyImportResult } from './legacy_import.js';
import { assertSchemaNotTooNew, openNodeSqlite, type NodeSqliteSession } from './node_sqlite.js';
import { DbError } from './ports.js';

export type BootstrapResult = {
  session: NodeSqliteSession;
  dbPath: string;
  migratedTo: number;
  created: boolean;
  legacyImport: LegacyImportResult;
};

/**
 * Node/Vitest bootstrap: open fail-safe, migrate, optional legacy import when newly created.
 */
export async function bootstrapNodeSqlite(
  dbPath: string,
  legacySource: unknown | null = null,
): Promise<BootstrapResult> {
  const opened = openNodeSqlite(dbPath);
  if (!opened.ok) throw opened.error;

  const { session, created } = opened;
  try {
    if (!created) {
      await assertSchemaNotTooNew(session);
    }
    const { migratedTo } = await migrate(session);
    let legacyImport: LegacyImportResult = {
      attempted: false,
      imported: false,
      notice: 'Existing SQLite database; skipped legacy import.',
    };
    if (created) {
      legacyImport = await tryLegacyImport(session, legacySource);
    }
    return { session, dbPath, migratedTo, created, legacyImport };
  } catch (e) {
    session.close();
    if (e instanceof DbError) throw e;
    throw new DbError('DB_MIGRATE_FAILED', e instanceof Error ? e.message : String(e));
  }
}
