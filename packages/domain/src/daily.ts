import { createPersonalAction, PersonalAction } from './actions.js';
import { Result, ok } from './result.js';
import { newId } from './validation.js';

export type DailyNextActionLine = {
  id: string;
  sortOrder: number;
  text: string;
  personalActionId?: string;
};

export type DailyReview = {
  id: string;
  date: string;
  outcomes: string;
  blockers: string;
  followUps: string;
  nextActionLines: DailyNextActionLine[];
  updatedAt: string;
};

export type MaterializeResult = {
  lines: DailyNextActionLine[];
  createdActions: PersonalAction[];
  updatedActions: PersonalAction[];
};

/**
 * FR-019: create on first non-empty; update open linked action description;
 * never delete action when line cleared/removed.
 */
export function materializeNextActions(
  lines: DailyNextActionLine[],
  existingActionsById: Map<string, PersonalAction>,
  nowIso: string,
): Result<MaterializeResult> {
  const createdActions: PersonalAction[] = [];
  const updatedActions: PersonalAction[] = [];
  const nextLines: DailyNextActionLine[] = [];

  for (const line of lines) {
    const text = line.text.trim();
    const lineId = line.id || newId();

    if (!text) {
      nextLines.push({ ...line, id: lineId, text: '' });
      continue;
    }

    if (!line.personalActionId) {
      const created = createPersonalAction({
        description: text,
        source: 'daily_next_action',
        sourceRef: lineId,
        nowIso,
      });
      if (!created.ok) return created;
      createdActions.push(created.data);
      nextLines.push({
        ...line,
        id: lineId,
        text,
        personalActionId: created.data.id,
      });
      continue;
    }

    const existing = existingActionsById.get(line.personalActionId);
    if (existing && existing.status === 'open' && existing.description !== text) {
      const updated = {
        ...existing,
        description: text,
        updatedAt: nowIso,
      };
      updatedActions.push(updated);
    }
    nextLines.push({ ...line, id: lineId, text, personalActionId: line.personalActionId });
  }

  return ok({ lines: nextLines, createdActions, updatedActions });
}

export function ensureLineIds(lines: DailyNextActionLine[]): DailyNextActionLine[] {
  return lines.map((l, i) => ({
    ...l,
    id: l.id || newId(),
    sortOrder: l.sortOrder ?? i,
  }));
}
