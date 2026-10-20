import type { DbSession } from './ports.js';

/**
 * Delete every user-data row and reseed the four application slots and
 * default settings. Schema/migrations are untouched. Child tables first
 * so foreign keys (where enforced) are satisfied.
 */
export async function resetWorkspaceData(session: DbSession, nowIso: string): Promise<void> {
  await session.withTransaction(async () => {
    const tables = [
      'work_allocations',
      'commitment_snapshots',
      'candidate_work_items',
      'period_member_capacity',
      'planning_periods',
      'team_members',
      'daily_next_action_lines',
      'daily_reviews',
      'fortnight_selections',
      'fortnight_plans',
      'monthly_reviews',
      'personal_actions',
      'inbox_items',
      'applications',
      'workspace_settings',
    ];
    for (const table of tables) {
      await session.exec(`DELETE FROM ${table}`);
    }
    for (const slot of [1, 2, 3, 4]) {
      await session.exec(
        `INSERT INTO applications (id, slot_index, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [`seed-app-${slot}`, slot, `Application ${slot}`, nowIso, nowIso],
      );
    }
    await session.exec(
      `INSERT INTO workspace_settings (id, fortnight_start_weekday, global_shortcut_enabled, global_shortcut_accel, updated_at) VALUES (1, 'mon', 1, 'CommandOrControl+Shift+L', ?)`,
      [nowIso],
    );
  });
}
