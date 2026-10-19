import Database from '@tauri-apps/plugin-sql';
import type { DbSession, SqlParams } from '@los/persistence';

/**
 * Full DbSession via @tauri-apps/plugin-sql including withTransaction (analyze L1).
 */
export async function createTauriSqlSession(sqliteUrl: string): Promise<DbSession & { close: () => Promise<void> }> {
  const db = await Database.load(sqliteUrl);

  return {
    async exec(sql: string, params: SqlParams = []): Promise<void> {
      await db.execute(sql, params as unknown[]);
    },
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params: SqlParams = [],
    ): Promise<T[]> {
      return (await db.select<T[]>(sql, params as unknown[])) as T[];
    },
    async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
      await db.execute('BEGIN');
      try {
        const result = await fn();
        await db.execute('COMMIT');
        return result;
      } catch (e) {
        await db.execute('ROLLBACK');
        throw e;
      }
    },
    async close() {
      await db.close();
    },
  };
}
