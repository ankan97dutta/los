import {
  buildReportDraft, err, listReportPeriods, localDateOf, mergeReportSections, newId, ok,
  reportCopyText, reportPeriodFor, summarizeDay,
  type ReportFacts, type ReportType, type ReportSection,
} from '@los/domain';
import { repos, nowIso, afterWrite, type WorkspaceRuntime } from './workspace.js';
import { planningPeriodGet } from './capacity_planning.js';

export async function reportPeriods(rt: WorkspaceRuntime, input: { reportType: ReportType; today?: string }) {
  const today = input.today ?? localDateOf(nowIso(rt));
  return ok({ periods: listReportPeriods(input.reportType, today, 12) });
}

async function gatherFacts(rt: WorkspaceRuntime, periodStart: string, periodEnd: string): Promise<ReportFacts> {
  const r = repos(rt);
  const actions = await r.actions.list({ status: 'all' });
  const completedActions = actions
    .filter((a) => a.status === 'done' && a.completedAt && a.completedAt.slice(0, 10) >= periodStart && a.completedAt.slice(0, 10) <= periodEnd)
    .map((a) => ({ description: a.description, completedAt: a.completedAt! }));
  const daily = await r.daily.listBetween(periodStart, periodEnd);
  const months: string[] = [];
  {
    const [y, m] = periodStart.split('-').map(Number);
    const [ey, em] = periodEnd.split('-').map(Number);
    let yy = y!, mm = m!;
    while (yy < ey! || (yy === ey && mm <= em!)) { months.push(`${yy}-${`${mm}`.padStart(2, '0')}`); mm++; if (mm > 12) { mm = 1; yy++; } }
  }
  let monthlyPriorities = '';
  for (const ym of months) {
    const rev = await r.monthly.getByYearMonth(ym);
    if (rev?.improvementPriorities) monthlyPriorities = rev.improvementPriorities;
  }
  const periods = (await r.planning.planningPeriods.listBetween(periodStart, periodEnd)).filter((p) => p.status === 'closed');
  const closedPeriods: ReportFacts['closedPeriods'] = [];
  for (const p of periods) {
    const full = await planningPeriodGet(rt, p.periodStart);
    if (full.ok) {
      closedPeriods.push({
        label: `${p.periodStart} to ${p.periodEnd}`,
        netHours: full.data.capacitySummary.totals.netHours,
        committedLoadHours: full.data.capacitySummary.totals.committedLoadHours,
        remainingHours: full.data.capacitySummary.totals.remainingHours,
        warnings: full.data.warnings.map((w) => w.message),
        outcomeSummary: p.outcomeSummary, tradeoffNotes: p.tradeoffNotes,
      });
    }
  }
  const focusSessions = await r.focus.listByFinishedDateRange(periodStart, periodEnd);
  const todaySummary = summarizeDay(focusSessions, periodStart);
  void todaySummary;
  const byTech = new Map<string, number>();
  for (const s of focusSessions) byTech.set(s.technique, (byTech.get(s.technique) ?? 0) + Math.floor(s.countedFocusSeconds / 60));
  const members = await r.planning.teamMembers.list();
  const apps = await r.applications.list();
  const inRange = (iso: string) => iso.slice(0, 10) >= periodStart && iso.slice(0, 10) <= periodEnd;
  return {
    completedActions,
    dailyOutcomes: daily.map((d) => d.outcomes).filter(Boolean),
    dailyBlockers: daily.map((d) => d.blockers).filter(Boolean),
    monthlyPriorities,
    closedPeriods,
    focus: {
      blocks: focusSessions.filter((s) => s.status !== 'endedEarly' && s.countedFocusSeconds > 0).length,
      minutes: focusSessions.reduce((a, s) => a + Math.floor(s.countedFocusSeconds / 60), 0),
      byTechnique: [...byTech.entries()].map(([label, minutes]) => ({ label, minutes })),
    },
    teamChanges: members.filter((mb) => inRange(mb.createdAt)).map((mb) => `${mb.displayName} joined the roster`),
    threadChanges: apps.filter((a) => inRange(a.createdAt)).map((a) => `${a.name} created`),
  };
}

export async function reportGenerate(rt: WorkspaceRuntime, input: { reportType: ReportType; periodStart: string }) {
  const r = repos(rt);
  const existing = await r.reports.getDraft(input.reportType, input.periodStart);
  if (existing) return ok(existing);
  const today = localDateOf(nowIso(rt));
  const period = reportPeriodFor(input.reportType, input.periodStart, today);
  const facts = await gatherFacts(rt, period.periodStart, period.periodEnd);
  const built = buildReportDraft(facts, period, nowIso(rt));
  await r.reports.saveDraft(built.draft, built.sections);
  afterWrite(rt);
  return ok(built);
}

export async function reportGet(rt: WorkspaceRuntime, input: { reportType: ReportType; periodStart: string }) {
  const found = await repos(rt).reports.getDraft(input.reportType, input.periodStart);
  return ok({ draft: found?.draft ?? null, sections: found?.sections ?? [] });
}

export async function reportSaveEdits(rt: WorkspaceRuntime, input: {
  draftId: string; title?: string; summary?: string;
  sections?: Array<{ sectionKey: string; heading?: string; body?: string }>;
  addSection?: { heading: string; body: string };
  removeSectionKey?: string;
  undoRemoveSectionKey?: string;
}) {
  const r = repos(rt);
  const found = await r.reports.getDraftById(input.draftId);
  if (!found) return err('NOT_FOUND', 'Report draft not found.');
  const now = nowIso(rt);
  const draft = { ...found.draft, updatedAt: now };
  if (input.title !== undefined && input.title !== draft.title) { draft.title = input.title; draft.titleEdited = true; }
  if (input.summary !== undefined && input.summary !== draft.summary) { draft.summary = input.summary; draft.summaryEdited = true; }
  let sections: ReportSection[] = found.sections.map((s) => ({ ...s }));
  for (const patch of input.sections ?? []) {
    sections = sections.map((s) => s.sectionKey === patch.sectionKey ? { ...s, heading: patch.heading ?? s.heading, body: patch.body ?? s.body, edited: true, updatedAt: now } : s);
  }
  if (input.addSection) {
    const key = `custom-${newId()}`;
    sections.push({ id: `${draft.id}-${key}`, draftId: draft.id, sectionKey: key, heading: input.addSection.heading, body: input.addSection.body, sourceKind: 'lead', edited: true, removed: false, sortOrder: Math.max(0, ...sections.map((s) => s.sortOrder)) + 1, updatedAt: now });
  }
  if (input.removeSectionKey) {
    sections = sections.map((s) => s.sectionKey === input.removeSectionKey ? { ...s, removed: true, edited: true, updatedAt: now } : s);
  }
  if (input.undoRemoveSectionKey) {
    sections = sections.map((s) => s.sectionKey === input.undoRemoveSectionKey ? { ...s, removed: false, updatedAt: now } : s);
  }
  await r.reports.saveDraft(draft, sections);
  afterWrite(rt);
  return ok({ draft, sections });
}

export async function reportRefresh(rt: WorkspaceRuntime, input: { draftId: string }) {
  const r = repos(rt);
  const found = await r.reports.getDraftById(input.draftId);
  if (!found) return err('NOT_FOUND', 'Report draft not found.');
  const today = localDateOf(nowIso(rt));
  const period = reportPeriodFor(found.draft.reportType, found.draft.periodStart, today);
  const facts = await gatherFacts(rt, period.periodStart, period.periodEnd);
  const fresh = buildReportDraft(facts, period, nowIso(rt));
  const merged = mergeReportSections(found.sections, fresh.sections);
  const draft = {
    ...found.draft,
    title: found.draft.titleEdited ? found.draft.title : fresh.draft.title,
    summary: found.draft.summaryEdited ? found.draft.summary : fresh.draft.summary,
    periodComplete: period.periodComplete,
    generatedAt: nowIso(rt), updatedAt: nowIso(rt),
  };
  await r.reports.saveDraft(draft, merged.sections);
  afterWrite(rt);
  return ok({ draft, sections: merged.sections, updatedSectionKeys: merged.updatedSectionKeys });
}

export async function reportCopy(rt: WorkspaceRuntime, input: { draftId: string }) {
  const found = await repos(rt).reports.getDraftById(input.draftId);
  if (!found) return err('NOT_FOUND', 'Report draft not found.');
  return ok({ text: reportCopyText(found.draft, found.sections, localDateOf(nowIso(rt))) });
}
