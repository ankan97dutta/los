import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';

describe('bootstrap absent', () => {
  it('creates DB only when file absent', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-boot-'));
    const dbPath = join(dir, 'los.sqlite');
    expect(existsSync(dbPath)).toBe(false);
    const boot = await bootstrapNodeSqlite(dbPath);
    expect(boot.created).toBe(true);
    expect(existsSync(dbPath)).toBe(true);
    boot.session.close();

    const boot2 = await bootstrapNodeSqlite(dbPath);
    expect(boot2.created).toBe(false);
    boot2.session.close();
  });
});
