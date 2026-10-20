import { Result } from './result.js';
import { newId, validateDescription } from './validation.js';

export type InboxStatus = 'open' | 'kept' | 'converted' | 'dismissed';

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

export type TriageDisposition = 'convert' | 'dismiss' | 'keep' | 'reopen';

export function applyTriage(
  item: InboxItem,
  disposition: TriageDisposition,
  nowIso: string,
  newActionId?: string,
): Result<InboxItem> {
  // 'open' = needs triage; 'kept' = deliberately parked for later. Both are actionable.
  if (item.status !== 'open' && item.status !== 'kept') {
    return { ok: false, error: { code: 'INVALID_STATE', message: 'Inbox item is not open.' } };
  }
  if (disposition === 'keep') {
    if (item.status !== 'open') {
      return { ok: false, error: { code: 'INVALID_STATE', message: 'Only an open item can be kept for later.' } };
    }
    return { ok: true, data: { ...item, status: 'kept', updatedAt: nowIso } };
  }
  if (disposition === 'reopen') {
    if (item.status !== 'kept') {
      return { ok: false, error: { code: 'INVALID_STATE', message: 'Only a kept item can return to the inbox.' } };
    }
    return { ok: true, data: { ...item, status: 'open', updatedAt: nowIso } };
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
