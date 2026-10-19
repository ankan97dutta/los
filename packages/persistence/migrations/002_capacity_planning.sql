-- Capacity planning tables (version 2). Applied by migrate; do not insert schema_migrations here.

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
