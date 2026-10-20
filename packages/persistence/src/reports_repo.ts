import type { ReportDraft, ReportSection, ReportsRepository } from '@los/domain';
import type { DbSession } from './ports.js';
import type { MemoryStore } from './memory_store.js';

type DRow = { id: string; report_type: ReportDraft['reportType']; period_start: string; period_end: string; period_complete: number; title: string; title_edited: number; summary: string; summary_edited: number; generated_at: string; updated_at: string };
type SRow = { id: string; draft_id: string; section_key: string; heading: string; body: string; source_kind: ReportSection['sourceKind']; edited: number; removed: number; sort_order: number; updated_at: string };

const toDraft = (r: DRow): ReportDraft => ({ id: r.id, reportType: r.report_type, periodStart: r.period_start, periodEnd: r.period_end, periodComplete: Boolean(r.period_complete), title: r.title, titleEdited: Boolean(r.title_edited), summary: r.summary, summaryEdited: Boolean(r.summary_edited), generatedAt: r.generated_at, updatedAt: r.updated_at });
const toSection = (r: SRow): ReportSection => ({ id: r.id, draftId: r.draft_id, sectionKey: r.section_key, heading: r.heading, body: r.body, sourceKind: r.source_kind, edited: Boolean(r.edited), removed: Boolean(r.removed), sortOrder: r.sort_order, updatedAt: r.updated_at });

export function createSqliteReportsRepo(db: DbSession): ReportsRepository {
  async function load(id: string) {
    const drafts = await db.query<DRow>(`SELECT * FROM report_drafts WHERE id = ?`, [id]);
    if (!drafts[0]) return null;
    const secs = await db.query<SRow>(`SELECT * FROM report_sections WHERE draft_id = ? ORDER BY sort_order`, [id]);
    return { draft: toDraft(drafts[0]), sections: secs.map(toSection) };
  }
  return {
    async saveDraft(draft, sections) {
      await db.exec(
        `INSERT INTO report_drafts (id, report_type, period_start, period_end, period_complete, title, title_edited, summary, summary_edited, generated_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, title_edited=excluded.title_edited, summary=excluded.summary, summary_edited=excluded.summary_edited, period_complete=excluded.period_complete, generated_at=excluded.generated_at, updated_at=excluded.updated_at`,
        [draft.id, draft.reportType, draft.periodStart, draft.periodEnd, draft.periodComplete ? 1 : 0, draft.title, draft.titleEdited ? 1 : 0, draft.summary, draft.summaryEdited ? 1 : 0, draft.generatedAt, draft.updatedAt],
      );
      for (const s of sections) {
        await db.exec(
          `INSERT INTO report_sections (id, draft_id, section_key, heading, body, source_kind, edited, removed, sort_order, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(draft_id, section_key) DO UPDATE SET heading=excluded.heading, body=excluded.body, source_kind=excluded.source_kind, edited=excluded.edited, removed=excluded.removed, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
          [s.id, s.draftId, s.sectionKey, s.heading, s.body, s.sourceKind, s.edited ? 1 : 0, s.removed ? 1 : 0, s.sortOrder, s.updatedAt],
        );
      }
    },
    async getDraft(reportType, periodStart) {
      const rows = await db.query<DRow>(`SELECT * FROM report_drafts WHERE report_type = ? AND period_start = ?`, [reportType, periodStart]);
      return rows[0] ? load(rows[0].id) : null;
    },
    async getDraftById(id) { return load(id); },
    async listDrafts() {
      const rows = await db.query<DRow>(`SELECT * FROM report_drafts ORDER BY period_start DESC`);
      return rows.map(toDraft);
    },
  };
}

export function createMemoryReportsRepo(store: MemoryStore): ReportsRepository {
  return {
    async saveDraft(draft, sections) {
      const i = store.data.reportDrafts.findIndex((x) => x.id === draft.id);
      if (i >= 0) store.data.reportDrafts[i] = { ...draft }; else store.data.reportDrafts.push({ ...draft });
      for (const s of sections) {
        const j = store.data.reportSections.findIndex((x) => x.draftId === s.draftId && x.sectionKey === s.sectionKey);
        if (j >= 0) store.data.reportSections[j] = { ...s }; else store.data.reportSections.push({ ...s });
      }
    },
    async getDraft(reportType, periodStart) {
      const draft = store.data.reportDrafts.find((x) => x.reportType === reportType && x.periodStart === periodStart);
      if (!draft) return null;
      return { draft: { ...draft }, sections: store.data.reportSections.filter((x) => x.draftId === draft.id).sort((a, b) => a.sortOrder - b.sortOrder) };
    },
    async getDraftById(id) {
      const draft = store.data.reportDrafts.find((x) => x.id === id);
      if (!draft) return null;
      return { draft: { ...draft }, sections: store.data.reportSections.filter((x) => x.draftId === draft.id).sort((a, b) => a.sortOrder - b.sortOrder) };
    },
    async listDrafts() { return [...store.data.reportDrafts]; },
  };
}
