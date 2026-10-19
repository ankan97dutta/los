import Database from 'better-sqlite3';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { APP_MAX_SCHEMA_VERSION, DbError, type DbSession, type SqlParams } from './ports.js';

export type OpenNodeSqliteResult =
  | { ok: true; session: NodeSqliteSession; created: boolean }
  | { ok: false; error: DbError };

export class NodeSqliteSession implements DbSession {
  constructor(private readonly db: Database.Database) {}

  async exec(sql: string, params: SqlParams = []): Promise<void> {
    if (params.length === 0) {
      this.db.exec(sql);
      return;
    }
    this.db.prepare(sql).run(...params);
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: SqlParams = [],
  ): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    this.db.exec('BEGIN');
    try {
      const result = await fn();
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  close(): void {
    this.db.close();
  }

  /** Expose native db for tests that need injected failure hooks. */
  get native(): Database.Database {
    return this.db;
  }
}

/**
 * Fail-safe open: create only if absent. Existing corrupt/locked/invalid → DB_OPEN_FAILED; bytes preserved.
 */
export function openNodeSqlite(dbPath: string): OpenNodeSqliteResult {
  const created = !existsSync(dbPath);
  try {
    if (created) {
      mkdirSync(dirname(dbPath), { recursive: true });
    } else {
      // Touch-stat so unreadable paths fail before open where possible
      statSync(dbPath);
    }
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    // Validate readable
    db.prepare('SELECT 1').get();
    return { ok: true, session: new NodeSqliteSession(db), created };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: new DbError('DB_OPEN_FAILED', `Failed to open database (file preserved): ${message}`),
    };
  }
}

export async function assertSchemaNotTooNew(session: DbSession): Promise<void> {
  try {
    const rows = await session.query<{ version: number }>(
      'SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations',
    );
    const max = Number(rows[0]?.version ?? 0);
    if (max > APP_MAX_SCHEMA_VERSION) {
      throw new DbError(
        'DB_SCHEMA_TOO_NEW',
        `Database schema version ${max} is newer than app max ${APP_MAX_SCHEMA_VERSION}`,
      );
    }
  } catch (e) {
    if (e instanceof DbError) throw e;
    // Missing table on brand-new file before migrate is fine
  }
}
