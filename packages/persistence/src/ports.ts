export type SqlValue = string | number | bigint | Uint8Array | null | boolean;
export type SqlParams = SqlValue[];

export type DbErrorCode =
  | 'DB_OPEN_FAILED'
  | 'DB_MIGRATE_FAILED'
  | 'DB_SCHEMA_TOO_NEW'
  | 'LEGACY_IMPORT_FAILED'
  | 'IO_ERROR';

export class DbError extends Error {
  readonly code: DbErrorCode;
  constructor(code: DbErrorCode, message: string) {
    super(message);
    this.name = 'DbError';
    this.code = code;
  }
}

/** Driver-agnostic SQLite session (Node better-sqlite3 or Tauri plugin-sql). */
export interface DbSession {
  exec(sql: string, params?: SqlParams): Promise<void>;
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: SqlParams,
  ): Promise<T[]>;
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
  close?(): Promise<void> | void;
}

/** Max schema version this app binary understands. */
export const APP_MAX_SCHEMA_VERSION = 2;
