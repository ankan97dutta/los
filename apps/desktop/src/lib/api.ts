import type { WorkspaceRuntime } from '@los/app-services';
import * as svc from '@los/app-services';
import type { Weekday } from '@los/domain';

/** Thin TS clients mirroring Tauri invoke command names (contracts). */
export const api = {
  inboxCapture: (rt: WorkspaceRuntime, description: string) => svc.inboxCapture(rt, description),
  inboxListOpen: (rt: WorkspaceRuntime) => svc.inboxListOpen(rt),
  inboxListKept: (rt: WorkspaceRuntime) => svc.inboxListKept(rt),
  inboxTriage: (
    rt: WorkspaceRuntime,
    id: string,
    disposition: 'convert' | 'dismiss' | 'keep' | 'reopen',
  ) => svc.inboxTriage(rt, id, disposition),
  actionsCreate: (rt: WorkspaceRuntime, description: string, applicationId?: string | null) =>
    svc.actionsCreate(rt, description, applicationId),
  actionsUpdate: (
    rt: WorkspaceRuntime,
    id: string,
    patch: { description?: string; applicationId?: string | null },
  ) => svc.actionsUpdate(rt, id, patch),
  actionsSetStatus: (rt: WorkspaceRuntime, id: string, status: 'open' | 'done') =>
    svc.actionsSetStatus(rt, id, status),
  actionsList: (
    rt: WorkspaceRuntime,
    filter?: { status?: 'open' | 'done' | 'all'; applicationId?: string | null },
  ) => svc.actionsList(rt, filter),
  applicationsList: (rt: WorkspaceRuntime) => svc.applicationsList(rt),
  applicationsRename: (rt: WorkspaceRuntime, id: string, name: string) =>
    svc.applicationsRename(rt, id, name),
  applicationsCreate: (rt: WorkspaceRuntime, name: string) => svc.applicationsCreate(rt, name),
  applicationsRemove: (rt: WorkspaceRuntime, id: string) => svc.applicationsRemove(rt, id),
  planningMemberRemove: (rt: WorkspaceRuntime, id: string) => svc.planningMemberRemove(rt, id),
  dailyGet: (rt: WorkspaceRuntime, date: string) => svc.dailyGet(rt, date),
  dailyUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.dailyUpsert>[1],
  ) => svc.dailyUpsert(rt, input),
  fortnightCurrentPeriod: (rt: WorkspaceRuntime, asOf?: string) =>
    svc.fortnightCurrentPeriod(rt, asOf),
  fortnightGet: (rt: WorkspaceRuntime, periodStart?: string) => svc.fortnightGet(rt, periodStart),
  fortnightUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.fortnightUpsert>[1],
  ) => svc.fortnightUpsert(rt, input),
  monthlyGet: (rt: WorkspaceRuntime, yearMonth?: string) => svc.monthlyGet(rt, yearMonth),
  monthlyUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.monthlyUpsert>[1],
  ) => svc.monthlyUpsert(rt, input),
  settingsGet: (rt: WorkspaceRuntime) => svc.settingsGet(rt),
  settingsUpdate: (
    rt: WorkspaceRuntime,
    patch: Partial<{
      fortnightStartWeekday: Weekday;
      globalShortcutEnabled: boolean;
      globalShortcutAccel: string;
      focusTechnique: string;
      focusCustomFocusMinutes: number;
      focusCustomBreakMinutes: number;
      focusLongBreakMinutes: number;
      focusSoundEnabled: boolean;
      focusNotificationsEnabled: boolean;
      focusNotificationsIncludeTask: boolean;
    }>,
  ) => svc.settingsUpdate(rt, patch),
  focusStart: (rt: WorkspaceRuntime, input: Parameters<typeof svc.focusStart>[1]) => svc.focusStart(rt, input),
  focusGetActive: (rt: WorkspaceRuntime) => svc.focusGetActive(rt),
  focusPause: (rt: WorkspaceRuntime, sessionId: string) => svc.focusPause(rt, { sessionId }),
  focusResume: (rt: WorkspaceRuntime, sessionId: string) => svc.focusResume(rt, { sessionId }),
  focusEndEarly: (rt: WorkspaceRuntime, sessionId: string) => svc.focusEndEarly(rt, { sessionId }),
  focusStartBreak: (rt: WorkspaceRuntime, sessionId: string) => svc.focusStartBreak(rt, { sessionId }),
  focusStartNextBlock: (rt: WorkspaceRuntime, previousSessionId: string) => svc.focusStartNextBlock(rt, { previousSessionId }),
  focusClose: (rt: WorkspaceRuntime, sessionId: string, markTaskDone?: boolean) => svc.focusClose(rt, { sessionId, markTaskDone }),
  focusTodaySummary: (rt: WorkspaceRuntime) => svc.focusTodaySummary(rt),
  focusTechniques: (rt: WorkspaceRuntime) => svc.focusTechniques(rt),
  reportPeriods: (rt: WorkspaceRuntime, reportType: 'mbr' | 'qbr') => svc.reportPeriods(rt, { reportType }),
  reportGenerate: (rt: WorkspaceRuntime, reportType: 'mbr' | 'qbr', periodStart: string) => svc.reportGenerate(rt, { reportType, periodStart }),
  reportGet: (rt: WorkspaceRuntime, reportType: 'mbr' | 'qbr', periodStart: string) => svc.reportGet(rt, { reportType, periodStart }),
  reportSaveEdits: (rt: WorkspaceRuntime, input: Parameters<typeof svc.reportSaveEdits>[1]) => svc.reportSaveEdits(rt, input),
  reportRefresh: (rt: WorkspaceRuntime, draftId: string) => svc.reportRefresh(rt, { draftId }),
  reportCopy: (rt: WorkspaceRuntime, draftId: string) => svc.reportCopy(rt, { draftId }),
  workspaceStatus: (rt: WorkspaceRuntime) => svc.workspaceStatus(rt),
  workspaceResetAll: (rt: WorkspaceRuntime) => svc.workspaceResetAll(rt),
  previousFortnight: svc.previousFortnight,
  nextFortnight: svc.nextFortnight,
  previousWeek: svc.previousWeek,
  nextWeek: svc.nextWeek,
  localToday: svc.localToday,
  planningPeriodGet: (rt: WorkspaceRuntime, periodStart?: string) =>
    svc.planningPeriodGet(rt, periodStart),
  planningPeriodSaveMeta: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningPeriodSaveMeta>[1],
  ) => svc.planningPeriodSaveMeta(rt, input),
  planningPeriodClose: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningPeriodClose>[1],
  ) => svc.planningPeriodClose(rt, input),
  planningHistoryGet: (rt: WorkspaceRuntime, periodStart: string) =>
    svc.planningHistoryGet(rt, periodStart),
  planningMembersList: (rt: WorkspaceRuntime) => svc.planningMembersList(rt),
  planningMemberUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningMemberUpsert>[1],
  ) => svc.planningMemberUpsert(rt, input),
  planningCapacityUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningCapacityUpsert>[1],
  ) => svc.planningCapacityUpsert(rt, input),
  planningWorkList: (rt: WorkspaceRuntime, periodStart: string) =>
    svc.planningWorkList(rt, periodStart),
  planningWorkUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningWorkUpsert>[1],
  ) => svc.planningWorkUpsert(rt, input),
  planningAllocate: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningAllocate>[1],
  ) => svc.planningAllocate(rt, input),
};
