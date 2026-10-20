import type {
  ActionsRepository,
  ApplicationsRepository,
  DailyRepository,
  FortnightRepository,
  InboxRepository,
  MonthlyRepository,
  SettingsRepository,
  InboxItem,
  PersonalAction,
  Application,
  DailyReview,
  FortnightPlan,
  MonthlyReview,
  WorkspaceSettings,
  Weekday,
} from '@los/domain';
import type { DbSession } from './ports.js';
import { createPlanningRepos, type PlanningRepos } from './planning_repos.js';

export type WorkspaceRepos = {
  inbox: InboxRepository;
  actions: ActionsRepository;
  applications: ApplicationsRepository;
  daily: DailyRepository;
  fortnight: FortnightRepository;
  monthly: MonthlyRepository;
  settings: SettingsRepository;
  planning: PlanningRepos;
};

export function createSqliteRepos(db: DbSession): WorkspaceRepos {
  return {
    planning: createPlanningRepos(db),
    inbox: {
      async listOpen() {
        const rows = await db.query<{
          id: string;
          description: string;
          status: InboxItem['status'];
          captured_at: string;
          updated_at: string;
          converted_action_id: string | null;
        }>(
          `SELECT id, description, status, captured_at, updated_at, converted_action_id
           FROM inbox_items WHERE status = 'open' ORDER BY captured_at DESC`,
        );
        return rows.map((r) => ({
          id: r.id,
          description: r.description,
          status: r.status,
          capturedAt: r.captured_at,
          updatedAt: r.updated_at,
          convertedActionId: r.converted_action_id ?? undefined,
        }));
      },
      async listKept() {
        const rows = await db.query<{
          id: string;
          description: string;
          status: InboxItem['status'];
          captured_at: string;
          updated_at: string;
          converted_action_id: string | null;
        }>(
          `SELECT id, description, status, captured_at, updated_at, converted_action_id
           FROM inbox_items WHERE status = 'kept' ORDER BY updated_at DESC`,
        );
        return rows.map((r) => ({
          id: r.id,
          description: r.description,
          status: r.status,
          capturedAt: r.captured_at,
          updatedAt: r.updated_at,
          convertedActionId: r.converted_action_id ?? undefined,
        }));
      },
      async getById(id) {
        const rows = await db.query<{
          id: string;
          description: string;
          status: InboxItem['status'];
          captured_at: string;
          updated_at: string;
          converted_action_id: string | null;
        }>(
          `SELECT id, description, status, captured_at, updated_at, converted_action_id
           FROM inbox_items WHERE id = ?`,
          [id],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          description: r.description,
          status: r.status,
          capturedAt: r.captured_at,
          updatedAt: r.updated_at,
          convertedActionId: r.converted_action_id ?? undefined,
        };
      },
      async save(item: InboxItem) {
        await db.exec(
          `INSERT INTO inbox_items (id, description, status, captured_at, updated_at, converted_action_id)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             description = excluded.description,
             status = excluded.status,
             captured_at = excluded.captured_at,
             updated_at = excluded.updated_at,
             converted_action_id = excluded.converted_action_id`,
          [
            item.id,
            item.description,
            item.status,
            item.capturedAt,
            item.updatedAt,
            item.convertedActionId ?? null,
          ],
        );
      },
    },
    actions: {
      async list(filter) {
        let sql = `SELECT id, description, status, source, source_ref, application_id, created_at, updated_at
                   FROM personal_actions WHERE 1=1`;
        const params: Array<string | null> = [];
        if (filter?.status && filter.status !== 'all') {
          sql += ` AND status = ?`;
          params.push(filter.status);
        }
        if (filter && 'applicationId' in (filter as object)) {
          sql += ` AND application_id IS ?`;
          params.push(filter!.applicationId ?? null);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await db.query<{
          id: string;
          description: string;
          status: PersonalAction['status'];
          source: PersonalAction['source'];
          source_ref: string | null;
          application_id: string | null;
          created_at: string;
          updated_at: string;
        }>(sql, params);
        return rows.map((r) => ({
          id: r.id,
          description: r.description,
          status: r.status,
          source: r.source,
          sourceRef: r.source_ref ?? undefined,
          applicationId: r.application_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      },
      async getById(id) {
        const rows = await db.query<{
          id: string;
          description: string;
          status: PersonalAction['status'];
          source: PersonalAction['source'];
          source_ref: string | null;
          application_id: string | null;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, description, status, source, source_ref, application_id, created_at, updated_at
           FROM personal_actions WHERE id = ?`,
          [id],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          description: r.description,
          status: r.status,
          source: r.source,
          sourceRef: r.source_ref ?? undefined,
          applicationId: r.application_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      },
      async save(action: PersonalAction) {
        await db.exec(
          `INSERT INTO personal_actions
             (id, description, status, source, source_ref, application_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             description = excluded.description,
             status = excluded.status,
             source = excluded.source,
             source_ref = excluded.source_ref,
             application_id = excluded.application_id,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
          [
            action.id,
            action.description,
            action.status,
            action.source,
            action.sourceRef ?? null,
            action.applicationId ?? null,
            action.createdAt,
            action.updatedAt,
          ],
        );
      },
    },
    applications: {
      async list() {
        const rows = await db.query<{
          id: string;
          slot_index: number;
          name: string;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, slot_index, name, created_at, updated_at FROM applications ORDER BY slot_index`,
        );
        return rows.map((r) => ({
          id: r.id,
          slotIndex: r.slot_index as 1 | 2 | 3 | 4,
          name: r.name,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      },
      async getById(id) {
        const rows = await db.query<{
          id: string;
          slot_index: number;
          name: string;
          created_at: string;
          updated_at: string;
        }>(`SELECT id, slot_index, name, created_at, updated_at FROM applications WHERE id = ?`, [
          id,
        ]);
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          slotIndex: r.slot_index as 1 | 2 | 3 | 4,
          name: r.name,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      },
      async save(app: Application) {
        await db.exec(
          `UPDATE applications SET name = ?, updated_at = ? WHERE id = ?`,
          [app.name, app.updatedAt, app.id],
        );
      },
    },
    daily: {
      async getByDate(date) {
        const reviews = await db.query<{
          id: string;
          date: string;
          outcomes: string;
          blockers: string;
          follow_ups: string;
          updated_at: string;
        }>(
          `SELECT id, date, outcomes, blockers, follow_ups, updated_at FROM daily_reviews WHERE date = ?`,
          [date],
        );
        const rev = reviews[0];
        if (!rev) return null;
        const lines = await db.query<{
          id: string;
          sort_order: number;
          text: string;
          personal_action_id: string | null;
        }>(
          `SELECT id, sort_order, text, personal_action_id FROM daily_next_action_lines
           WHERE daily_review_id = ? ORDER BY sort_order`,
          [rev.id],
        );
        return {
          id: rev.id,
          date: rev.date,
          outcomes: rev.outcomes,
          blockers: rev.blockers,
          followUps: rev.follow_ups,
          nextActionLines: lines.map((l) => ({
            id: l.id,
            sortOrder: l.sort_order,
            text: l.text,
            personalActionId: l.personal_action_id ?? undefined,
          })),
          updatedAt: rev.updated_at,
        };
      },
      async save(review: DailyReview) {
        await db.exec(
          `INSERT INTO daily_reviews (id, date, outcomes, blockers, follow_ups, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             date = excluded.date,
             outcomes = excluded.outcomes,
             blockers = excluded.blockers,
             follow_ups = excluded.follow_ups,
             updated_at = excluded.updated_at`,
          [
            review.id,
            review.date,
            review.outcomes,
            review.blockers,
            review.followUps,
            review.updatedAt,
          ],
        );
        await db.exec(`DELETE FROM daily_next_action_lines WHERE daily_review_id = ?`, [review.id]);
        for (const line of review.nextActionLines) {
          await db.exec(
            `INSERT INTO daily_next_action_lines
               (id, daily_review_id, sort_order, text, personal_action_id)
             VALUES (?, ?, ?, ?, ?)`,
            [line.id, review.id, line.sortOrder, line.text, line.personalActionId ?? null],
          );
        }
      },
    },
    fortnight: {
      async getByPeriodStart(periodStart) {
        const plans = await db.query<{
          id: string;
          period_start: string;
          period_end: string;
          commitments: string;
          updated_at: string;
        }>(
          `SELECT id, period_start, period_end, commitments, updated_at
           FROM fortnight_plans WHERE period_start = ?`,
          [periodStart],
        );
        const p = plans[0];
        if (!p) return null;
        const sels = await db.query<{ action_id: string }>(
          `SELECT action_id FROM fortnight_selections WHERE plan_id = ?`,
          [p.id],
        );
        return {
          id: p.id,
          periodStart: p.period_start,
          periodEnd: p.period_end,
          commitments: p.commitments,
          selectedActionIds: sels.map((s) => s.action_id),
          updatedAt: p.updated_at,
        };
      },
      async save(plan: FortnightPlan) {
        await db.exec(
          `INSERT INTO fortnight_plans (id, period_start, period_end, commitments, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             period_start = excluded.period_start,
             period_end = excluded.period_end,
             commitments = excluded.commitments,
             updated_at = excluded.updated_at`,
          [plan.id, plan.periodStart, plan.periodEnd, plan.commitments, plan.updatedAt],
        );
        await db.exec(`DELETE FROM fortnight_selections WHERE plan_id = ?`, [plan.id]);
        for (const actionId of plan.selectedActionIds) {
          await db.exec(
            `INSERT INTO fortnight_selections (plan_id, action_id) VALUES (?, ?)`,
            [plan.id, actionId],
          );
        }
      },
    },
    monthly: {
      async getByYearMonth(yearMonth) {
        const rows = await db.query<{
          id: string;
          year_month: string;
          improvement_priorities: string;
          updated_at: string;
        }>(
          `SELECT id, year_month, improvement_priorities, updated_at FROM monthly_reviews WHERE year_month = ?`,
          [yearMonth],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          yearMonth: r.year_month,
          improvementPriorities: r.improvement_priorities,
          updatedAt: r.updated_at,
        };
      },
      async save(review: MonthlyReview) {
        await db.exec(
          `INSERT INTO monthly_reviews (id, year_month, improvement_priorities, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             year_month = excluded.year_month,
             improvement_priorities = excluded.improvement_priorities,
             updated_at = excluded.updated_at`,
          [review.id, review.yearMonth, review.improvementPriorities, review.updatedAt],
        );
      },
    },
    settings: {
      async get() {
        const rows = await db.query<{
          fortnight_start_weekday: string;
          global_shortcut_enabled: number;
          global_shortcut_accel: string;
          updated_at: string;
        }>(
          `SELECT fortnight_start_weekday, global_shortcut_enabled, global_shortcut_accel, updated_at
           FROM workspace_settings WHERE id = 1`,
        );
        const r = rows[0];
        if (!r) {
          throw new Error('WorkspaceSettings missing (migrations not applied?)');
        }
        return {
          fortnightStartWeekday: r.fortnight_start_weekday as Weekday,
          globalShortcutEnabled: Boolean(r.global_shortcut_enabled),
          globalShortcutAccel: r.global_shortcut_accel,
          updatedAt: r.updated_at,
        };
      },
      async save(settings: WorkspaceSettings) {
        await db.exec(
          `UPDATE workspace_settings SET
             fortnight_start_weekday = ?,
             global_shortcut_enabled = ?,
             global_shortcut_accel = ?,
             updated_at = ?
           WHERE id = 1`,
          [
            settings.fortnightStartWeekday,
            settings.globalShortcutEnabled ? 1 : 0,
            settings.globalShortcutAccel,
            settings.updatedAt,
          ],
        );
      },
    },
  };
}
