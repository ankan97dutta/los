import {
  closeSession, createFocusSession, endEarly, err, isActive, localDateOf, ok, pauseSession,
  reconcileSession, resumeSession, startBreak, summarizeDay, TECHNIQUES,
  type FocusSession, type TechniqueKey,
} from '@los/domain';
import { repos, nowIso, afterWrite, type WorkspaceRuntime } from './workspace.js';

async function reconcileAll(rt: WorkspaceRuntime): Promise<FocusSession | null> {
  const r = repos(rt);
  const active = await r.focus.listActive();
  let current: FocusSession | null = null;
  for (const s of active) {
    const next = reconcileSession(s, nowIso(rt));
    if (next.status !== s.status || next.countedFocusSeconds !== s.countedFocusSeconds) await r.focus.save(next);
    if (isActive(next) || next.status === 'focusDone' || next.status === 'breakDone') current = next;
  }
  if (current) afterWrite(rt);
  return current;
}

export async function focusStart(rt: WorkspaceRuntime, input: {
  taskKind: 'action' | 'workItem' | 'intention';
  taskRef?: string | null;
  intention?: string;
  taskLabel?: string;
  technique: TechniqueKey;
  focusMinutes?: number;
  breakMinutes?: number;
}) {
  const r = repos(rt);
  const existing = await reconcileAll(rt);
  if (existing && isActive(existing)) return err('FOCUS_ALREADY_ACTIVE', 'A focus session is already running. Resume it or end it first.');
  let label = input.taskLabel ?? input.intention ?? '';
  if (input.taskKind === 'action' && input.taskRef) {
    const a = await r.actions.getById(input.taskRef);
    if (!a) return err('NOT_FOUND', 'Action not found.');
    label = a.description;
  }
  if (input.taskKind === 'workItem' && input.taskRef) {
    const w = await r.planning.candidateWork.getById(input.taskRef);
    if (!w) return err('NOT_FOUND', 'Work item not found.');
    label = w.title;
  }
  const settings = await r.settings.get();
  const created = createFocusSession({
    taskKind: input.taskKind, taskRef: input.taskRef ?? null, taskLabel: label,
    technique: input.technique,
    focusMinutes: input.focusMinutes ?? settings.focusCustomFocusMinutes,
    breakMinutes: input.breakMinutes ?? settings.focusCustomBreakMinutes,
    longBreakMinutes: settings.focusLongBreakMinutes,
    nowIso: nowIso(rt),
  });
  if (!created.ok) return created;
  await r.focus.save(created.data);
  await r.settings.save({
    ...settings,
    focusTechnique: input.technique,
    focusCustomFocusMinutes: input.technique === 'custom' ? created.data.plannedFocusMinutes : settings.focusCustomFocusMinutes,
    focusCustomBreakMinutes: input.technique === 'custom' ? created.data.plannedBreakMinutes : settings.focusCustomBreakMinutes,
    updatedAt: nowIso(rt),
  });
  afterWrite(rt);
  return ok({ session: created.data });
}

export async function focusGetActive(rt: WorkspaceRuntime) {
  return ok({ session: await reconcileAll(rt) });
}

async function mutate(rt: WorkspaceRuntime, id: string, fn: (s: FocusSession) => FocusSession) {
  const r = repos(rt);
  const s = await r.focus.getById(id);
  if (!s) return err('NOT_FOUND', 'Focus session not found.');
  const next = fn(reconcileSession(s, nowIso(rt)));
  await r.focus.save(next);
  afterWrite(rt);
  return ok({ session: next });
}

export async function focusPause(rt: WorkspaceRuntime, input: { sessionId: string }) {
  return mutate(rt, input.sessionId, (s) => pauseSession(s, nowIso(rt)));
}
export async function focusResume(rt: WorkspaceRuntime, input: { sessionId: string }) {
  return mutate(rt, input.sessionId, (s) => resumeSession(s, nowIso(rt)));
}
export async function focusEndEarly(rt: WorkspaceRuntime, input: { sessionId: string }) {
  return mutate(rt, input.sessionId, (s) => endEarly(s, nowIso(rt)));
}
export async function focusStartBreak(rt: WorkspaceRuntime, input: { sessionId: string }) {
  return mutate(rt, input.sessionId, (s) => startBreak(s, nowIso(rt)));
}
export async function focusClose(rt: WorkspaceRuntime, input: { sessionId: string; markTaskDone?: boolean }) {
  const r = repos(rt);
  const result = await mutate(rt, input.sessionId, (s) => closeSession(s));
  if (!result.ok) return result;
  if (input.markTaskDone && result.data.session.taskKind === 'action' && result.data.session.taskRef) {
    const a = await r.actions.getById(result.data.session.taskRef);
    if (a && a.status !== 'done') {
      await r.actions.save({ ...a, status: 'done', completedAt: nowIso(rt), updatedAt: nowIso(rt) });
      afterWrite(rt);
    }
  }
  return result;
}
export async function focusStartNextBlock(rt: WorkspaceRuntime, input: { previousSessionId: string }) {
  const r = repos(rt);
  const prev = await r.focus.getById(input.previousSessionId);
  if (!prev) return err('NOT_FOUND', 'Focus session not found.');
  await r.focus.save(closeSession(prev));
  // Create directly so blockIndex advances (focusStart would reset it to 1).
  const created = createFocusSession({
    taskKind: prev.taskKind, taskRef: prev.taskRef, taskLabel: prev.taskLabel, technique: prev.technique,
    focusMinutes: prev.plannedFocusMinutes, breakMinutes: prev.plannedBreakMinutes,
    longBreakMinutes: prev.longBreakMinutes,
    blockIndex: prev.blockIndex >= prev.setSize ? 1 : prev.blockIndex + 1,
    nowIso: nowIso(rt),
  });
  if (!created.ok) return created;
  await r.focus.save(created.data);
  afterWrite(rt);
  return ok({ session: created.data });
}
export async function focusTodaySummary(rt: WorkspaceRuntime, input?: { localDate?: string }) {
  const date = input?.localDate ?? localDateOf(nowIso(rt));
  const sessions = await repos(rt).focus.listByFinishedDateRange(date, date);
  const all = sessions.length ? sessions : [];
  return ok({ localDate: date, ...summarizeDay(all, date) });
}
export async function focusReconcile(rt: WorkspaceRuntime) {
  return ok({ session: await reconcileAll(rt) });
}
export async function focusTechniques(rt: WorkspaceRuntime) {
  const settings = await repos(rt).settings.get();
  return ok({ techniques: Object.values(TECHNIQUES), settings });
}
