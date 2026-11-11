-- Borrador de cada documento: un borrador por documento, compartido por los admins.
-- `content` es el documento completo (ya validado, como en `documents`). Publicar lo
-- convierte en la versión vigente y borra el borrador.
CREATE TABLE document_drafts (
  document_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  -- Cuenta los guardados: un guardado solo vale si trae la revisión que hay (evita pisar al otro admin).
  revision INTEGER NOT NULL,
  -- `documents.updated_at` cuando se creó el borrador (null: el documento era nuevo). Si cambia, el borrador quedó viejo.
  base_updated_at TEXT,
  updated_by TEXT REFERENCES reviewers(id),
  updated_at TEXT NOT NULL
);
