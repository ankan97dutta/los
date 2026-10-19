import { Result } from './result.js';
import { newId, validateDescription } from './validation.js';

export type ActionStatus = 'open' | 'done';
export type ActionSource = 'manual' | 'inbox' | 'daily_next_action';

export type PersonalAction = {
  id: string;
  description: string;
  status: ActionStatus;
  applicationId: string | null;
  source: ActionSource;
  sourceRef?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export function createPersonalAction(input: {
  description: string;
  applicationId?: string | null;
  source: ActionSource;
  sourceRef?: string;
  nowIso: string;
  id?: string;
}): Result<PersonalAction> {
  const v = validateDescription(input.description);
  if (!v.ok) return v;
  return {
    ok: true,
    data: {
      id: input.id ?? newId(),
      description: v.data,
      status: 'open',
      applicationId: input.applicationId ?? null,
      source: input.source,
      sourceRef: input.sourceRef,
      createdAt: input.nowIso,
      updatedAt: input.nowIso,
    },
  };
}

export function setActionStatus(
  action: PersonalAction,
  status: ActionStatus,
  nowIso: string,
): PersonalAction {
  if (status === 'done') {
    return {
      ...action,
      status: 'done',
      completedAt: nowIso,
      updatedAt: nowIso,
    };
  }
  return {
    ...action,
    status: 'open',
    completedAt: undefined,
    updatedAt: nowIso,
  };
}

export function updateActionDescription(
  action: PersonalAction,
  descriptionRaw: string,
  nowIso: string,
): Result<PersonalAction> {
  const v = validateDescription(descriptionRaw);
  if (!v.ok) return v;
  return {
    ok: true,
    data: { ...action, description: v.data, updatedAt: nowIso },
  };
}
