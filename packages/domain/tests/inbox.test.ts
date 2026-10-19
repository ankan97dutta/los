import { describe, expect, it } from 'vitest';
import { createInboxItem } from '../src/inbox.js';
import { DESCRIPTION_MAX } from '../src/result.js';

describe('inbox capture validation', () => {
  const now = '2026-10-19T12:00:00.000Z';

  it('rejects empty', () => {
    const r = createInboxItem('   ', now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('EMPTY_DESCRIPTION');
  });

  it('rejects over 4000', () => {
    const r = createInboxItem('a'.repeat(DESCRIPTION_MAX + 1), now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DESCRIPTION_TOO_LONG');
  });

  it('accepts valid', () => {
    const r = createInboxItem('  Smoke request  ', now);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.description).toBe('Smoke request');
      expect(r.data.status).toBe('open');
    }
  });
});
