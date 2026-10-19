import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { APP_MAX_SCHEMA_VERSION, DbError } from './ports.js';

export function exportSqliteBackup(livePath: string, destPath: string): void {
  if (!existsSync(livePath)) {
    throw new DbError('IO_ERROR', `Live database not found: ${livePath}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(livePath, destPath);
}

/**
 * Read max schema version from a SQLite file without mutating the live DB.
 */
export function readBackupSchemaVersion(backupPath: string): number {
  if (!existsSync(backupPath)) {
    throw new DbError('IO_ERROR', `Backup not found: ${backupPath}`);
  }
  const db = new Database(backupPath, { readonly: true, fileMustExist: true });
  try {
    const row = db
      .prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations')
      .get() as { version: number } | undefined;
    return Number(row?.version ?? 0);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new DbError('DB_OPEN_FAILED', `Cannot read backup schema: ${message}`);
  } finally {
    db.close();
  }
}

/**
 * Refuse restore when backup schema is newer than the app **before** replacing live file.
 */
export function restoreSqliteBackup(backupPath: string, livePath: string): void {
  const version = readBackupSchemaVersion(backupPath);
  if (version > APP_MAX_SCHEMA_VERSION) {
    throw new DbError(
      'DB_SCHEMA_TOO_NEW',
      `Backup schema version ${version} exceeds app max ${APP_MAX_SCHEMA_VERSION}`,
    );
  }
  // Preserve evidence that live file was not replaced on too-new (caller checks error)
  mkdirSync(dirname(livePath), { recursive: true });
  copyFileSync(backupPath, livePath);
}

export function fileFingerprint(path: string): { size: number; bytes: Buffer } {
  const st = statSync(path);
  return { size: st.size, bytes: readFileSync(path) };
}
