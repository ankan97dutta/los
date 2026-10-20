-- Inbox "keep for later" status (version 3). SQLite cannot alter a CHECK
-- constraint, so the table is recreated and rows copied verbatim.

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
