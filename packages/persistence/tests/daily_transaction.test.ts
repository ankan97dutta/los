import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';
import { newId } from '@los/domain';

describe('daily transaction', () => {
  it('rolls back action insert when review save fails', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-tx-'));
    const boot = await bootstrapNodeSqlite(join(dir, 'los.sqlite'));
    const session = boot.session;
    const repos = createSqliteRepos(session);

    const actionId = newId();
    const reviewId = newId();

    await expect(
      session.withTransaction(async () => {
        await repos.actions.save({
          id: actionId,
          description: 'Should roll back',
          status: 'open',
          source: 'daily_next_action',
          applicationId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        // Force failure after action insert, before review commit completes
        throw new Error('injected failure after action insert');
      }),
    ).rejects.toThrow(/injected failure/);

    expect(await repos.actions.getById(actionId)).toBeNull();
    expect(await repos.daily.getByDate('2099-01-01')).toBeNull();
    void reviewId;
    session.close();
  });
});
