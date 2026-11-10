-- Los documentos viven en la base: la página y el Worker no guardan archivos.
-- `content` es el JSON completo del documento (validado al guardar, máx. ~1 MB).
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  updated TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT REFERENCES reviewers(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- «Archivar» oculta el documento sin borrar sus comentarios; volver a subirlo con el mismo id lo reactiva.
  archived_at TEXT
);

-- Contenido anterior de cada documento cada vez que se reemplaza: para poder deshacer.
CREATE TABLE document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,
  saved_by TEXT REFERENCES reviewers(id),
  saved_at TEXT NOT NULL
);
CREATE INDEX document_versions_document ON document_versions (document_id, saved_at);

-- Datos del espacio (nombre, descripción, rol), por clave. Hoy solo existe `space`.
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
