-- Revisores: una persona = un PIN. El PIN se guarda como HMAC, nunca en claro.
CREATE TABLE reviewers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL UNIQUE,
  is_admin INTEGER NOT NULL DEFAULT 0,
  max_devices INTEGER NOT NULL DEFAULT 2,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

-- Dispositivos que ya canjearon el PIN. Pasado max_devices, hay que resetear.
CREATE TABLE devices (
  reviewer_id TEXT NOT NULL REFERENCES reviewers(id),
  device_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  PRIMARY KEY (reviewer_id, device_id)
);

-- Intentos fallidos de login por IP, para frenar la fuerza bruta.
CREATE TABLE login_failures (
  ip TEXT NOT NULL,
  failed_at TEXT NOT NULL
);
CREATE INDEX login_failures_ip ON login_failures (ip, failed_at);

-- Comentarios por bloque. document_id permite reusar el backend en otros documentos.
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  parent_id TEXT REFERENCES comments(id),
  reviewer_id TEXT NOT NULL REFERENCES reviewers(id),
  text TEXT,
  block_excerpt TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX comments_document ON comments (document_id, block_id);

-- OK por bloque: una fila por revisor y bloque.
CREATE TABLE approvals (
  document_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL REFERENCES reviewers(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (document_id, block_id, reviewer_id)
);
