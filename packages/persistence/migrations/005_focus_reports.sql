-- Focus sessions, report drafts and focus preferences (version 5). Keep in sync with migrations_embedded.ts

CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  task_kind TEXT NOT NULL CHECK (task_kind IN ('action', 'workItem', 'intention')),
  task_ref TEXT,
  task_label TEXT NOT NULL,
  technique TEXT NOT NULL CHECK (technique IN ('pomodoro', 'deep', 'custom')),
  planned_focus_minutes INTEGER NOT NULL,
  planned_break_minutes INTEGER NOT NULL,
  long_break_minutes INTEGER NOT NULL,
  block_index INTEGER NOT NULL,
  set_size INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'focusDone', 'breakRunning', 'breakDone', 'finished', 'endedEarly')),
  started_at TEXT NOT NULL,
  focus_ends_at TEXT,
  paused_remaining_seconds INTEGER,
  paused_at TEXT,
  break_ends_at TEXT,
  ended_at TEXT,
  counted_focus_seconds INTEGER NOT NULL DEFAULT 0,
  finished_local_date TEXT
);

CREATE TABLE IF NOT EXISTS report_drafts (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('mbr', 'qbr')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  period_complete INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  title_edited INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT '',
  summary_edited INTEGER NOT NULL DEFAULT 0,
  generated_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (report_type, period_start)
);

CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  section_key TEXT NOT NULL,
  heading TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL,
  edited INTEGER NOT NULL DEFAULT 0,
  removed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (draft_id, section_key),
  FOREIGN KEY (draft_id) REFERENCES report_drafts(id)
);

ALTER TABLE workspace_settings ADD COLUMN focus_technique TEXT NOT NULL DEFAULT 'pomodoro';
ALTER TABLE workspace_settings ADD COLUMN focus_custom_focus_minutes INTEGER NOT NULL DEFAULT 25;
ALTER TABLE workspace_settings ADD COLUMN focus_custom_break_minutes INTEGER NOT NULL DEFAULT 5;
ALTER TABLE workspace_settings ADD COLUMN focus_long_break_minutes INTEGER NOT NULL DEFAULT 20;
ALTER TABLE workspace_settings ADD COLUMN focus_sound_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE workspace_settings ADD COLUMN focus_notifications_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE workspace_settings ADD COLUMN focus_notifications_include_task INTEGER NOT NULL DEFAULT 0;
ALTER TABLE personal_actions ADD COLUMN completed_at TEXT;
