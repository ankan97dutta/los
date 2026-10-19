import { describe, expect, it } from 'vitest';
import { applyTriage, createInboxItem } from '../src/inbox.js';

describe('inbox triage', () => {
  const now = '2026-10-19T12:00:00.000Z';
  const later = '2026-10-19T13:00:00.000Z';

  it('convert / dismiss / keep', () => {
    const created = createInboxItem('Item', now);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const keep = applyTriage(created.data, 'keep', later);
    expect(keep.ok).toBe(true);
    if (keep.ok) expect(keep.data.status).toBe('open');

    const dismiss = applyTriage(created.data, 'dismiss', later);
    expect(dismiss.ok).toBe(true);
    if (dismiss.ok) expect(dismiss.data.status).toBe('dismissed');

    const convert = applyTriage(created.data, 'convert', later, 'action-1');
    expect(convert.ok).toBe(true);
    if (convert.ok) {
      expect(convert.data.status).toBe('converted');
      expect(convert.data.convertedActionId).toBe('action-1');
    }
  });

  it('rejects triage when not open', () => {
    const created = createInboxItem('Item', now);
    if (!created.ok) return;
    const dismissed = applyTriage(created.data, 'dismiss', later);
    if (!dismissed.ok) return;
    const again = applyTriage(dismissed.data, 'convert', later, 'x');
    expect(again.ok).toBe(false);
  });
});
