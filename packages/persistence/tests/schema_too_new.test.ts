import { describe, expect, it } from 'vitest';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { fileFingerprint, restoreSqliteBackup } from '../src/backup.js';
import { DbError } from '../src/ports.js';

describe('DB_SCHEMA_TOO_NEW', () => {
  it('refuses restore before replacing live file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-schema-'));
    const livePath = join(dir, 'los.sqlite');
    const boot = await bootstrapNodeSqlite(livePath);
    boot.session.close();

    const backupPath = join(dir, 'backup.sqlite');
    copyFileSync(livePath, backupPath);
    // Bump schema version on backup only
    const Database = (await import('better-sqlite3')).default;
    const bdb = new Database(backupPath);
    bdb
      .prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
      .run(99, new Date().toISOString());
    bdb.close();

    const before = fileFingerprint(livePath);
    try {
      restoreSqliteBackup(backupPath, livePath);
      expect.fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(DbError);
      expect((e as DbError).code).toBe('DB_SCHEMA_TOO_NEW');
    }
    const after = fileFingerprint(livePath);
    expect(Buffer.compare(after.bytes, before.bytes)).toBe(0);
  });
});
