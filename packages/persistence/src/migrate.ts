import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateWithScripts, type MigrationScript } from './migrate_core.js';
import type { DbSession } from './ports.js';

export {
  getAppliedVersions,
  migrateWithScripts,
  type MigrationScript,
} from './migrate_core.js';

function defaultMigrationsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
}

/** Node helper: load *.sql from disk then migrate. */
export async function migrate(
  session: DbSession,
  migrationsDir: string = defaultMigrationsDir(),
): Promise<{ migratedTo: number }> {
  const files = readdirSync(migrationsDir)
    .filter((f: string) => /^\d+_.*\.sql$/.test(f))
    .sort();
  const scripts: MigrationScript[] = files.map((file: string) => ({
    version: Number(file.split('_')[0]),
    sql: readFileSync(join(migrationsDir, file), 'utf8'),
  }));
  return migrateWithScripts(session, scripts);
}
