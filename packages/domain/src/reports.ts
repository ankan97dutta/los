export type ReportType = 'mbr' | 'qbr';
export type ReportSectionKey = 'highlights' | 'delivery' | 'focus' | 'risks' | 'decisions' | 'priorities' | string;
export type ReportSourceKind = 'reviewNotes' | 'planning' | 'focusRecords' | 'lead';

export type ReportPeriod = {
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  label: string;
  periodComplete: boolean;
  effectiveEnd: string;
};

export type ReportDraft = {
  id: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  periodComplete: boolean;
  title: string;
  titleEdited: boolean;
  summary: string;
  summaryEdited: boolean;
  generatedAt: string;
  updatedAt: string;
};

export type ReportSection = {
  id: string;
  draftId: string;
  sectionKey: string;
  heading: string;
  body: string;
  sourceKind: ReportSourceKind;
  edited: boolean;
  removed: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type ReportFacts = {
  completedActions: Array<{ description: string; completedAt: string }>;
  dailyOutcomes: string[];
  dailyBlockers: string[];
  monthlyPriorities: string;
  closedPeriods: Array<{
    label: string;
    netHours: number;
    committedLoadHours: number;
    remainingHours: number;
    warnings: string[];
    outcomeSummary: string;
    tradeoffNotes: string;
  }>;
  focus: { blocks: number; minutes: number; byTechnique: Array<{ label: string; minutes: number }> };
  teamChanges: string[];
  threadChanges: string[];
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MON3[(m ?? 1) - 1]} ${y}`;
}

function pad(n: number): string { return `${n}`.padStart(2, '0'); }
function ymd(y: number, m: number, d: number): string { return `${y}-${pad(m)}-${pad(d)}`; }

export function reportPeriodFor(reportType: ReportType, anchorDate: string, today: string): ReportPeriod {
  const [y, m] = anchorDate.split('-').map(Number);
  let start: string; let end: string; let label: string;
  if (reportType === 'mbr') {
    start = ymd(y!, m!, 1);
    const last = new Date(y!, m!, 0).getDate();
    end = ymd(y!, m!, last);
    label = `Monthly review, ${MONTHS[(m ?? 1) - 1]} ${y}`;
  } else {
    const qStartMonth = Math.floor(((m ?? 1) - 1) / 3) * 3 + 1;
    start = ymd(y!, qStartMonth, 1);
    const endMonth = qStartMonth + 2;
    const last = new Date(y!, endMonth, 0).getDate();
    end = ymd(y!, endMonth, last);
    label = `Quarterly review, ${MONTHS[qStartMonth - 1]} to ${MONTHS[endMonth - 1]} ${y}`;
  }
  const periodComplete = today > end;
  return { reportType, periodStart: start, periodEnd: end, label, periodComplete, effectiveEnd: periodComplete ? end : today };
}

export function listReportPeriods(reportType: ReportType, today: string, count = 8): ReportPeriod[] {
  const periods: ReportPeriod[] = [];
  let anchor = today;
  for (let i = 0; i < count; i++) {
    const p = reportPeriodFor(reportType, anchor, today);
    periods.push(p);
    const [y, m] = p.periodStart.split('-').map(Number);
    const prev = reportType === 'mbr' ? new Date(y!, (m ?? 1) - 2, 1) : new Date(y!, (m ?? 1) - 4, 1);
    anchor = ymd(prev.getFullYear(), prev.getMonth() + 1, 1);
  }
  return periods;
}

const EMPTY = {
  highlights: 'No completed work recorded in this period.',
  delivery: 'No closed planning periods in this period.',
  focus: 'No focus sessions recorded in this period.',
  risks: 'No blockers recorded in this period.',
  decisions: 'No decisions recorded in this period.',
  priorities: 'No priorities recorded yet.',
};

function lines(items: string[], empty: string): string {
  const clean = items.map((s) => s.trim()).filter(Boolean);
  return clean.length ? clean.map((s) => `- ${s}`).join('\n') : empty;
}

export function buildReportDraft(facts: ReportFacts, period: ReportPeriod, nowIso: string): { draft: ReportDraft; sections: ReportSection[] } {
  const draftId = `report-${period.reportType}-${period.periodStart}`;
  const periodLine = period.periodComplete
    ? `Covers ${fmtDate(period.periodStart)} to ${fmtDate(period.periodEnd)}.`
    : `Covers ${fmtDate(period.periodStart)} to today, ${fmtDate(period.effectiveEnd)}. This period is still running.`;
  const summary = [
    periodLine,
    `${facts.completedActions.length} action(s) completed.`,
    facts.closedPeriods.length ? `${facts.closedPeriods.length} closed planning period(s).` : 'No closed planning periods.',
    facts.focus.blocks ? `${facts.focus.blocks} focus block(s), ${facts.focus.minutes} focused minutes.` : 'No focus sessions recorded.',
  ].join(' ');
  const draft: ReportDraft = {
    id: draftId, reportType: period.reportType, periodStart: period.periodStart, periodEnd: period.periodEnd,
    periodComplete: period.periodComplete, title: period.label, titleEdited: false,
    summary, summaryEdited: false, generatedAt: nowIso, updatedAt: nowIso,
  };
  const mk = (key: string, heading: string, body: string, sourceKind: ReportSourceKind, sortOrder: number): ReportSection => ({
    id: `${draftId}-${key}`, draftId, sectionKey: key, heading, body, sourceKind, edited: false, removed: false, sortOrder, updatedAt: nowIso,
  });
  const deliveryBody = facts.closedPeriods.length
    ? [
        ...facts.closedPeriods.map((p) => `- ${p.label}: capacity ${p.netHours}h, committed ${p.committedLoadHours}h, remaining ${p.remainingHours}h.`),
        ...facts.teamChanges.map((s) => `- Team: ${s}`),
        ...facts.threadChanges.map((s) => `- Thread: ${s}`),
      ].join('\n')
    : EMPTY.delivery;
  const sections = [
    mk('highlights', 'Highlights and wins', lines([...facts.dailyOutcomes, ...facts.completedActions.map((a) => a.description)], EMPTY.highlights), 'reviewNotes', 1),
    mk('delivery', 'Delivery and capacity', deliveryBody, 'planning', 2),
    mk('focus', 'Focus and workload', facts.focus.blocks ? [`${facts.focus.blocks} focus block(s), ${facts.focus.minutes} focused minutes.`, ...facts.focus.byTechnique.map((t) => `- ${t.label}: ${t.minutes} minutes`)].join('\n') : EMPTY.focus, 'focusRecords', 3),
    mk('risks', 'Risks and blockers', lines([...facts.dailyBlockers, ...facts.closedPeriods.flatMap((p) => p.warnings)], EMPTY.risks), 'reviewNotes', 4),
    mk('decisions', 'Key decisions', lines(facts.closedPeriods.flatMap((p) => [p.outcomeSummary, p.tradeoffNotes]), EMPTY.decisions), 'planning', 5),
    mk('priorities', 'Priorities for next period', facts.monthlyPriorities.trim() ? facts.monthlyPriorities.trim() : EMPTY.priorities, 'reviewNotes', 6),
  ];
  return { draft, sections };
}

export function mergeReportSections(existing: ReportSection[], fresh: ReportSection[]): { sections: ReportSection[]; updatedSectionKeys: string[] } {
  const updated: string[] = [];
  const byKey = new Map(existing.map((s) => [s.sectionKey, s]));
  const out: ReportSection[] = [];
  for (const f of fresh) {
    const e = byKey.get(f.sectionKey);
    if (!e) { out.push(f); updated.push(f.sectionKey); continue; }
    if (e.removed) { out.push(e); continue; }
    if (e.edited) { out.push(e); continue; }
    if (e.body !== f.body || e.heading !== f.heading) updated.push(f.sectionKey);
    out.push({ ...f, id: e.id });
    byKey.delete(f.sectionKey);
  }
  for (const rest of byKey.values()) out.push(rest);
  out.sort((a, b) => a.sortOrder - b.sortOrder);
  return { sections: out, updatedSectionKeys: updated };
}

export function reportCopyText(draft: ReportDraft, sections: ReportSection[], today: string): string {
  const period = reportPeriodFor(draft.reportType, draft.periodStart, today);
  const periodLine = draft.periodComplete
    ? `Covers ${fmtDate(draft.periodStart)} to ${fmtDate(draft.periodEnd)}.`
    : `Covers ${fmtDate(draft.periodStart)} to today, ${fmtDate(period.effectiveEnd)}. This period is still running.`;
  const parts = [draft.title, periodLine, '', draft.summary];
  for (const s of sections.filter((x) => !x.removed).sort((a, b) => a.sortOrder - b.sortOrder)) {
    parts.push('', s.heading, s.body);
  }
  return parts.join('\n');
}