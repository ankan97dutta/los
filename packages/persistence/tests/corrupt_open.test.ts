import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileFingerprint } from '../src/backup.js';
import { openNodeSqlite } from '../src/node_sqlite.js';

describe('corrupt open', () => {
  it('preserves file bytes on DB_OPEN_FAILED', () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-corrupt-'));
    const dbPath = join(dir, 'los.sqlite');
    writeFileSync(dbPath, 'NOT A SQLITE DATABASE!!!');
    const before = fileFingerprint(dbPath);
    const opened = openNodeSqlite(dbPath);
    expect(opened.ok).toBe(false);
    if (opened.ok) return;
    expect(opened.error.code).toBe('DB_OPEN_FAILED');
    const after = fileFingerprint(dbPath);
    expect(after.size).toBe(before.size);
    expect(Buffer.compare(after.bytes, before.bytes)).toBe(0);
  });
});
