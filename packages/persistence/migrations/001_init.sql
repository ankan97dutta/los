-- Canonical schema for LOS local DB (target: SQLite).
-- Current runtime uses schema-versioned JSON via MemoryStore/file_store;
-- this SQL documents the relational shape and seed rules (T013–T015).

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

-- Seed: exactly four Application rows
INSERT OR IGNORE INTO applications (id, slot_index, name, created_at, updated_at) VALUES
  ('seed-app-1', 1, 'Application 1', datetime('now'), datetime('now')),
  ('seed-app-2', 2, 'Application 2', datetime('now'), datetime('now')),
  ('seed-app-3', 3, 'Application 3', datetime('now'), datetime('now')),
  ('seed-app-4', 4, 'Application 4', datetime('now'), datetime('now'));

-- Seed: singleton WorkspaceSettings
INSERT OR IGNORE INTO workspace_settings (
  id, fortnight_start_weekday, global_shortcut_enabled, global_shortcut_accel, updated_at
) VALUES (1, 'mon', 1, 'CommandOrControl+Shift+L', datetime('now'));

INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'));
