-- Threads (formerly Applications) are no longer limited to four slots (version 4).

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
