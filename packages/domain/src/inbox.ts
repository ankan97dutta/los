import { Result } from './result.js';
import { newId, validateDescription } from './validation.js';

export type InboxStatus = 'open' | 'converted' | 'dismissed';

export type InboxItem = {
  id: string;
  description: string;
  status: InboxStatus;
  capturedAt: string;
  updatedAt: string;
  convertedActionId?: string;
};

export function createInboxItem(descriptionRaw: string, nowIso: string): Result<InboxItem> {
  const v = validateDescription(descriptionRaw);
  if (!v.ok) return v;
  return {
    ok: true,
    data: {
      id: newId(),
      description: v.data,
      status: 'open',
      capturedAt: nowIso,
      updatedAt: nowIso,
    },
  };
}

export type TriageDisposition = 'convert' | 'dismiss' | 'keep';

export function applyTriage(
  item: InboxItem,
  disposition: TriageDisposition,
  nowIso: string,
  newActionId?: string,
): Result<InboxItem> {
  if (item.status !== 'open') {
    return { ok: false, error: { code: 'INVALID_STATE', message: 'Inbox item is not open.' } };
  }
  if (disposition === 'keep') {
    return { ok: true, data: { ...item, updatedAt: nowIso } };
  }
  if (disposition === 'dismiss') {
    return {
      ok: true,
      data: { ...item, status: 'dismissed', updatedAt: nowIso },
    };
  }
  // convert
  if (!newActionId) {
    return {
      ok: false,
      error: { code: 'INVALID_STATE', message: 'convert requires newActionId.' },
    };
  }
  return {
    ok: true,
    data: {
      ...item,
      status: 'converted',
      convertedActionId: newActionId,
      updatedAt: nowIso,
    },
  };
}
