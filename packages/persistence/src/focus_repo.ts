import type { FocusRepository, FocusSession } from '@los/domain';
import type { DbSession } from './ports.js';
import type { MemoryStore } from './memory_store.js';

type Row = {
  id: string; task_kind: FocusSession['taskKind']; task_ref: string | null; task_label: string;
  technique: FocusSession['technique']; planned_focus_minutes: number; planned_break_minutes: number;
  long_break_minutes: number; block_index: number; set_size: number; status: FocusSession['status'];
  started_at: string; focus_ends_at: string | null; paused_remaining_seconds: number | null;
  paused_at: string | null; break_ends_at: string | null; ended_at: string | null;
  counted_focus_seconds: number; finished_local_date: string | null;
};

function toSession(r: Row): FocusSession {
  return {
    id: r.id, taskKind: r.task_kind, taskRef: r.task_ref, taskLabel: r.task_label, technique: r.technique,
    plannedFocusMinutes: r.planned_focus_minutes, plannedBreakMinutes: r.planned_break_minutes,
    longBreakMinutes: r.long_break_minutes, blockIndex: r.block_index, setSize: r.set_size, status: r.status,
    startedAt: r.started_at, focusEndsAt: r.focus_ends_at, pausedRemainingSeconds: r.paused_remaining_seconds,
    pausedAt: r.paused_at, breakEndsAt: r.break_ends_at, endedAt: r.ended_at,
    countedFocusSeconds: r.counted_focus_seconds, finishedLocalDate: r.finished_local_date,
  };
}

const COLS = `id, task_kind, task_ref, task_label, technique, planned_focus_minutes, planned_break_minutes, long_break_minutes, block_index, set_size, status, started_at, focus_ends_at, paused_remaining_seconds, paused_at, break_ends_at, ended_at, counted_focus_seconds, finished_local_date`;

export function createSqliteFocusRepo(db: DbSession): FocusRepository {
  return {
    async save(s) {
      await db.exec(
        `INSERT INTO focus_sessions (${COLS}) VALUES (${COLS.split(',').map(() => '?').join(',')})
         ON CONFLICT(id) DO UPDATE SET task_kind=excluded.task_kind, task_ref=excluded.task_ref, task_label=excluded.task_label, technique=excluded.technique, planned_focus_minutes=excluded.planned_focus_minutes, planned_break_minutes=excluded.planned_break_minutes, long_break_minutes=excluded.long_break_minutes, block_index=excluded.block_index, set_size=excluded.set_size, status=excluded.status, started_at=excluded.started_at, focus_ends_at=excluded.focus_ends_at, paused_remaining_seconds=excluded.paused_remaining_seconds, paused_at=excluded.paused_at, break_ends_at=excluded.break_ends_at, ended_at=excluded.ended_at, counted_focus_seconds=excluded.counted_focus_seconds, finished_local_date=excluded.finished_local_date`,
        [s.id, s.taskKind, s.taskRef, s.taskLabel, s.technique, s.plannedFocusMinutes, s.plannedBreakMinutes, s.longBreakMinutes, s.blockIndex, s.setSize, s.status, s.startedAt, s.focusEndsAt, s.pausedRemainingSeconds, s.pausedAt, s.breakEndsAt, s.endedAt, s.countedFocusSeconds, s.finishedLocalDate],
      );
    },
    async getById(id) {
      const rows = await db.query<Row>(`SELECT ${COLS} FROM focus_sessions WHERE id = ?`, [id]);
      return rows[0] ? toSession(rows[0]) : null;
    },
    async listActive() {
      const rows = await db.query<Row>(`SELECT ${COLS} FROM focus_sessions WHERE status IN ('running','paused','breakRunning') ORDER BY started_at DESC`);
      return rows.map(toSession);
    },
    async listByFinishedDateRange(startDate, endDate) {
      const rows = await db.query<Row>(`SELECT ${COLS} FROM focus_sessions WHERE finished_local_date >= ? AND finished_local_date <= ? ORDER BY started_at`, [startDate, endDate]);
      return rows.map(toSession);
    },
    async listAll() {
      const rows = await db.query<Row>(`SELECT ${COLS} FROM focus_sessions ORDER BY started_at`);
      return rows.map(toSession);
    },
  };
}

export function createMemoryFocusRepo(store: MemoryStore): FocusRepository {
  const all = () => [...store.data.focusSessions];
  return {
    async save(s) {
      const i = store.data.focusSessions.findIndex((x) => x.id === s.id);
      if (i >= 0) store.data.focusSessions[i] = { ...s }; else store.data.focusSessions.push({ ...s });
    },
    async getById(id) { return all().find((x) => x.id === id) ?? null; },
    async listActive() { return all().filter((x) => x.status === 'running' || x.status === 'paused' || x.status === 'breakRunning'); },
    async listByFinishedDateRange(a, b) { return all().filter((x) => x.finishedLocalDate != null && x.finishedLocalDate >= a && x.finishedLocalDate <= b); },
    async listAll() { return all(); },
  };
}
