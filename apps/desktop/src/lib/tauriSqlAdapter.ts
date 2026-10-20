import Database from '@tauri-apps/plugin-sql';
import type { DbSession, SqlParams } from '@los/persistence';

/**
 * Full DbSession via @tauri-apps/plugin-sql.
 *
 * All operations are serialized through a single promise queue. Without
 * this, concurrent React effects could interleave BEGIN/write/COMMIT calls
 * over the plugin's connection pool — a COMMIT landing while another
 * transaction is open can leave a write transaction dangling, after which
 * later writes fail with "database is locked" (saves/reset appear dead).
 * Calls made from inside `withTransaction` bypass the queue (re-entrant)
 * so the transaction body cannot deadlock against itself.
 */
export async function createTauriSqlSession(sqliteUrl: string): Promise<DbSession & { close: () => Promise<void> }> {
  const db = await Database.load(sqliteUrl);

  let tail: Promise<unknown> = Promise.resolve();
  let inTransaction = false;

  function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = tail.then(fn, fn);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  const session: DbSession & { close: () => Promise<void> } = {
    exec(sql: string, params: SqlParams = []): Promise<void> {
      if (inTransaction) {
        return db.execute(sql, params as unknown[]).then(() => undefined);
      }
      return enqueue(async () => {
        await db.execute(sql, params as unknown[]);
      });
    },
    query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params: SqlParams = [],
    ): Promise<T[]> {
      if (inTransaction) {
        return db.select<T[]>(sql, params as unknown[]) as Promise<T[]>;
      }
      return enqueue(async () => (await db.select<T[]>(sql, params as unknown[])) as T[]);
    },
    withTransaction<T>(fn: () => Promise<T>): Promise<T> {
      return enqueue(async () => {
        inTransaction = true;
        await db.execute('BEGIN IMMEDIATE');
        try {
          const result = await fn();
          await db.execute('COMMIT');
          return result;
        } catch (e) {
          try {
            await db.execute('ROLLBACK');
          } catch {
            // Already rolled back; surface the original error.
          }
          throw e;
        } finally {
          inTransaction = false;
        }
      });
    },
    async close() {
      await enqueue(async () => {
        await db.close();
      });
    },
  };
  return session;
}
