import { describe, expect, it } from 'vitest';
import { materializeNextActions } from '../src/daily.js';
import type { PersonalAction } from '../src/actions.js';

describe('daily next actions materialization', () => {
  const now = '2026-10-19T12:00:00.000Z';

  it('creates action once and does not duplicate', () => {
    const first = materializeNextActions(
      [{ id: 'line-1', sortOrder: 0, text: 'Follow up' }],
      new Map(),
      now,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.createdActions).toHaveLength(1);
    const actionId = first.data.createdActions[0].id;
    const map = new Map<string, PersonalAction>([[actionId, first.data.createdActions[0]]]);

    const second = materializeNextActions(first.data.lines, map, now);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.createdActions).toHaveLength(0);
  });

  it('updates open action description on text change', () => {
    const first = materializeNextActions(
      [{ id: 'line-1', sortOrder: 0, text: 'A' }],
      new Map(),
      now,
    );
    if (!first.ok) return;
    const action = first.data.createdActions[0];
    const map = new Map([[action.id, action]]);
    const lines = first.data.lines.map((l) => ({ ...l, text: 'B' }));
    const second = materializeNextActions(lines, map, now);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.updatedActions).toHaveLength(1);
    expect(second.data.updatedActions[0].description).toBe('B');
  });

  it('does not delete action when line cleared', () => {
    const first = materializeNextActions(
      [{ id: 'line-1', sortOrder: 0, text: 'Keep me' }],
      new Map(),
      now,
    );
    if (!first.ok) return;
    const action = first.data.createdActions[0];
    const map = new Map([[action.id, action]]);
    const cleared = materializeNextActions(
      [{ id: 'line-1', sortOrder: 0, text: '', personalActionId: action.id }],
      map,
      now,
    );
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.data.createdActions).toHaveLength(0);
    expect(map.has(action.id)).toBe(true);
  });

  it('empty lines create nothing', () => {
    const r = materializeNextActions([{ id: 'x', sortOrder: 0, text: '  ' }], new Map(), now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.createdActions).toHaveLength(0);
  });
});
