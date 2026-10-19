import { APP_MAX_SCHEMA_VERSION, DbError, type DbSession } from './ports.js';

export type MigrationScript = { version: number; sql: string };

export async function getAppliedVersions(session: DbSession): Promise<number[]> {
  await session.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
  const rows = await session.query<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  );
  return rows.map((r) => Number(r.version));
}

/**
 * Apply pending migrations transactionally (one transaction per migration).
 */
export async function migrateWithScripts(
  session: DbSession,
  migrations: MigrationScript[],
): Promise<{ migratedTo: number }> {
  const all = [...migrations].sort((a, b) => a.version - b.version);
  const maxFile = all.reduce((m, x) => Math.max(m, x.version), 0);
  if (maxFile > APP_MAX_SCHEMA_VERSION) {
    throw new DbError(
      'DB_MIGRATE_FAILED',
      `Migration files exceed APP_MAX_SCHEMA_VERSION (${APP_MAX_SCHEMA_VERSION})`,
    );
  }

  const applied = new Set(await getAppliedVersions(session));
  const pending = all.filter((m) => !applied.has(m.version));

  for (const m of pending) {
    try {
      await session.withTransaction(async () => {
        await session.exec(m.sql);
        await session.exec('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
          m.version,
          new Date().toISOString(),
        ]);
      });
    } catch (e) {
      if (e instanceof DbError) throw e;
      const message = e instanceof Error ? e.message : String(e);
      throw new DbError('DB_MIGRATE_FAILED', `Migration ${m.version} failed: ${message}`);
    }
  }

  const versions = await getAppliedVersions(session);
  const migratedTo = versions.length ? Math.max(...versions) : 0;
  if (migratedTo > APP_MAX_SCHEMA_VERSION) {
    throw new DbError(
      'DB_SCHEMA_TOO_NEW',
      `Database schema version ${migratedTo} is newer than app max ${APP_MAX_SCHEMA_VERSION}`,
    );
  }
  return { migratedTo };
}
