import { describe, expect, it } from 'vitest';
import { createPersonalAction, setActionStatus } from '../src/actions.js';
import { DESCRIPTION_MAX } from '../src/result.js';

describe('personal actions', () => {
  const now = '2026-10-19T12:00:00.000Z';

  it('rejects description over 4000', () => {
    const r = createPersonalAction({
      description: 'x'.repeat(DESCRIPTION_MAX + 1),
      source: 'manual',
      nowIso: now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DESCRIPTION_TOO_LONG');
  });

  it('open ↔ done', () => {
    const r = createPersonalAction({
      description: 'Do thing',
      source: 'manual',
      applicationId: null,
      nowIso: now,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const done = setActionStatus(r.data, 'done', now);
    expect(done.status).toBe('done');
    expect(done.completedAt).toBe(now);
    const reopen = setActionStatus(done, 'open', now);
    expect(reopen.status).toBe('open');
    expect(reopen.completedAt).toBeUndefined();
  });
});
