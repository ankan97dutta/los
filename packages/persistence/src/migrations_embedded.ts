/** Embedded migrations for browser/Tauri migrate. Keep in sync with migrations/*.sql */
export const MIGRATION_SCRIPTS = [
  { version: 1 as const, sql: `-- Canonical schema for LOS local DB (SQLite). Applied by migrate.ts (version 1).
-- Runner records schema_migrations; do not insert migration version here.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  slot_index INTEGER NOT NULL UNIQUE CHECK (slot_index BETWEEN 1 AND 4),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inbox_items (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'converted', 'dismissed')),
  captured_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  converted_action_id TEXT
);

CREATE TABLE IF NOT EXISTS personal_actions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'done')),
  source TEXT NOT NULL,
  source_ref TEXT,
  application_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_reviews (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  outcomes TEXT NOT NULL DEFAULT '',
  blockers TEXT NOT NULL DEFAULT '',
  follow_ups TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_next_action_lines (
  id TEXT PRIMARY KEY,
  daily_review_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  personal_action_id TEXT,
  FOREIGN KEY (daily_review_id) REFERENCES daily_reviews(id)
);

CREATE TABLE IF NOT EXISTS fortnight_plans (
  id TEXT PRIMARY KEY,
  period_start TEXT NOT NULL UNIQUE,
  period_end TEXT NOT NULL,
  commitments TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fortnight_selections (
  plan_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  PRIMARY KEY (plan_id, action_id),
  FOREIGN KEY (plan_id) REFERENCES fortnight_plans(id)
);

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id TEXT PRIMARY KEY,
  year_month TEXT NOT NULL UNIQUE,
  improvement_priorities TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  fortnight_start_weekday TEXT NOT NULL DEFAULT 'mon',
  global_shortcut_enabled INTEGER NOT NULL DEFAULT 1,
  global_shortcut_accel TEXT NOT NULL DEFAULT 'CommandOrControl+Shift+L',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO applications (id, slot_index, name, created_at, updated_at) VALUES
  ('seed-app-1', 1, 'Thread 1', datetime('now'), datetime('now')),
  ('seed-app-2', 2, 'Thread 2', datetime('now'), datetime('now')),
  ('seed-app-3', 3, 'Thread 3', datetime('now'), datetime('now')),
  ('seed-app-4', 4, 'Thread 4', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workspace_settings (
  id, fortnight_start_weekday, global_shortcut_enabled, global_shortcut_accel, updated_at
) VALUES (1, 'mon', 1, 'CommandOrControl+Shift+L', datetime('now'));
` },
  { version: 2 as const, sql: `-- Capacity planning tables (version 2). Applied by migrate; do not insert schema_migrations here.

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planning_periods (
  period_start TEXT PRIMARY KEY,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  tradeoff_notes TEXT NOT NULL DEFAULT '',
  outcome_summary TEXT NOT NULL DEFAULT '',
  carryover_notes TEXT NOT NULL DEFAULT '',
  warnings_acknowledged_at TEXT,
  closed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS period_member_capacity (
  id TEXT PRIMARY KEY,
  period_start TEXT NOT NULL,
  team_member_id TEXT NOT NULL,
  available_hours REAL NOT NULL CHECK (available_hours >= 0),
  leave_hours REAL NOT NULL CHECK (leave_hours >= 0),
  reserved_commitment_hours REAL NOT NULL CHECK (reserved_commitment_hours >= 0),
  unplanned_buffer_hours REAL NOT NULL CHECK (unplanned_buffer_hours >= 0),
  updated_at TEXT NOT NULL,
  UNIQUE (period_start, team_member_id),
  FOREIGN KEY (period_start) REFERENCES planning_periods(period_start),
  FOREIGN KEY (team_member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS candidate_work_items (
  id TEXT PRIMARY KEY,
  period_start TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  estimate_hours REAL,
  estimate_unknown INTEGER NOT NULL DEFAULT 0 CHECK (estimate_unknown IN (0, 1)),
  actual_hours REAL,
  application_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'blocked', 'waiting_external', 'done', 'dropped')),
  dependency_notes TEXT NOT NULL DEFAULT '',
  carried_from_work_item_id TEXT,
  personal_action_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (estimate_unknown = 1 AND estimate_hours IS NULL)
    OR (estimate_unknown = 0)
  ),
  FOREIGN KEY (period_start) REFERENCES planning_periods(period_start)
);

CREATE TABLE IF NOT EXISTS work_allocations (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL UNIQUE,
  team_member_id TEXT,
  commitment_kind TEXT NOT NULL CHECK (commitment_kind IN ('none', 'commitment', 'stretch')),
  updated_at TEXT NOT NULL,
  CHECK (
    (commitment_kind != 'commitment')
    OR (commitment_kind = 'commitment' AND team_member_id IS NOT NULL)
  ),
  FOREIGN KEY (work_item_id) REFERENCES candidate_work_items(id),
  FOREIGN KEY (team_member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS commitment_snapshots (
  id TEXT PRIMARY KEY,
  period_start TEXT NOT NULL UNIQUE,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (period_start) REFERENCES planning_periods(period_start)
);
` },
  { version: 3 as const, sql: `-- Inbox "keep for later" status (version 3). Keep in sync with migrations/003_inbox_kept.sql

CREATE TABLE inbox_items_v3 (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'kept', 'converted', 'dismissed')),
  captured_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  converted_action_id TEXT
);

INSERT INTO inbox_items_v3 (id, description, status, captured_at, updated_at, converted_action_id)
SELECT id, description, status, captured_at, updated_at, converted_action_id FROM inbox_items;

DROP TABLE inbox_items;
ALTER TABLE inbox_items_v3 RENAME TO inbox_items;
` },
  { version: 4 as const, sql: `-- Threads (formerly Applications) are no longer limited to four slots (version 4). Keep in sync with migrations/004_threads.sql

CREATE TABLE applications_v4 (
  id TEXT PRIMARY KEY,
  slot_index INTEGER NOT NULL UNIQUE CHECK (slot_index >= 1),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO applications_v4 (id, slot_index, name, created_at, updated_at)
SELECT id, slot_index, name, created_at, updated_at FROM applications;

DROP TABLE applications;
ALTER TABLE applications_v4 RENAME TO applications;
` },
];
