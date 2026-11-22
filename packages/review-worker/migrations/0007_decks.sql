-- Presentaciones (decks) y sus temas. Todo vive en la base, igual que los documentos.

-- Un tema es su JSON (`Theme` de deck-core) más sus archivos (fuentes).
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT REFERENCES reviewers(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Archivos de un tema, en base64 (D1 guarda texto sin problemas y el CLI los sube en trozos).
CREATE TABLE theme_files (
  theme_id TEXT NOT NULL REFERENCES themes(id),
  file TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (theme_id, file)
);

-- `content` es el JSON completo del deck (validado al guardar). Los comentarios de una
-- presentación se guardan con `document_id = 'deck:<id>'` en las mismas tablas de revisión.
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theme_id TEXT NOT NULL REFERENCES themes(id),
  content TEXT NOT NULL,
  created_by TEXT REFERENCES reviewers(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE deck_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id TEXT NOT NULL,
  content TEXT NOT NULL,
  saved_by TEXT REFERENCES reviewers(id),
  saved_at TEXT NOT NULL
);
CREATE INDEX deck_versions_deck ON deck_versions (deck_id, saved_at);

-- Imágenes y otros archivos que el deck pide por ruta relativa (`assets/…`).
CREATE TABLE deck_files (
  deck_id TEXT NOT NULL,
  path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (deck_id, path)
);
