-- Tareas: algo que una persona tiene que hacer para una fecha. Pueden colgar de un
-- documento y de un bloque (sin clave foránea: los bloques cambian con cada versión).
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  document_id TEXT,
  block_id TEXT,
  assignee_id TEXT NOT NULL REFERENCES reviewers(id),
  -- AAAA-MM-DD: un día, sin hora ni zona.
  due_date TEXT NOT NULL,
  done_at TEXT,
  created_by TEXT NOT NULL REFERENCES reviewers(id),
  created_at TEXT NOT NULL
);
CREATE INDEX tasks_assignee ON tasks (assignee_id, done_at, due_date);
CREATE INDEX tasks_document ON tasks (document_id, done_at, due_date);
