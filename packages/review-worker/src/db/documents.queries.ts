import type {
  DocumentContent,
  DocumentListItem,
  SpaceInfo,
} from '@juntanza/review-core';

type ListRow = {
  id: string;
  title: string;
  description: string | null;
  version: string;
  updated: string;
  open_threads: number | null;
  comments: number | null;
  approvals: number | null;
  comment_last: string | null;
  approval_last: string | null;
};

/** La fecha ISO más reciente de las dos (alguna puede faltar). */
function later(a: string | null, b: string | null): string | null {
  if (!a || !b) return a ?? b;
  return a > b ? a : b;
}

/** Documentos visibles, con la actividad de cada uno: alimenta la home. */
export async function listDocuments(
  db: D1Database,
): Promise<DocumentListItem[]> {
  const { results } = await db
    .prepare(
      `SELECT d.id, d.title, d.description, d.version, d.updated,
              c.open_threads, c.total AS comments, a.total AS approvals,
              c.last_at AS comment_last, a.last_at AS approval_last
       FROM documents d
       LEFT JOIN (
         SELECT document_id,
                SUM(CASE WHEN text IS NOT NULL THEN 1 ELSE 0 END) AS total,
                SUM(CASE WHEN parent_id IS NULL AND resolved_at IS NULL AND text IS NOT NULL THEN 1 ELSE 0 END) AS open_threads,
                MAX(created_at) AS last_at
         FROM comments GROUP BY document_id
       ) c ON c.document_id = d.id
       LEFT JOIN (
         SELECT document_id, COUNT(*) AS total, MAX(created_at) AS last_at
         FROM approvals GROUP BY document_id
       ) a ON a.document_id = d.id
       WHERE d.archived_at IS NULL
       ORDER BY d.updated DESC, d.title`,
    )
    .all<ListRow>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    version: row.version,
    updated: row.updated,
    openThreads: row.open_threads ?? 0,
    comments: row.comments ?? 0,
    approvals: row.approvals ?? 0,
    lastActivityAt: later(row.comment_last, row.approval_last),
  }));
}

/** El contenido de un documento no archivado, o null. */
export async function findDocument(
  db: D1Database,
  id: string,
): Promise<DocumentContent | null> {
  const row = await db
    .prepare(
      'SELECT content FROM documents WHERE id = ? AND archived_at IS NULL',
    )
    .bind(id)
    .first<{ content: string }>();
  return row ? (JSON.parse(row.content) as DocumentContent) : null;
}

/**
 * Crea el documento o lo reemplaza (y lo reactiva si estaba archivado). Lo que
 * había queda en `document_versions`. Devuelve si era nuevo.
 */
export async function saveDocument(
  db: D1Database,
  document: DocumentContent,
  reviewerId: string,
  now: string,
): Promise<{ created: boolean }> {
  const existing = await db
    .prepare('SELECT content FROM documents WHERE id = ?')
    .bind(document.id)
    .first<{ content: string }>();
  const content = JSON.stringify(document);
  const description = document.description ?? null;

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO documents (id, title, description, version, updated, content, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        document.id,
        document.title,
        description,
        document.version,
        document.updated,
        content,
        reviewerId,
        now,
        now,
      )
      .run();
    return { created: true };
  }

  await db.batch([
    db
      .prepare(
        'INSERT INTO document_versions (document_id, content, saved_by, saved_at) VALUES (?, ?, ?, ?)',
      )
      .bind(document.id, existing.content, reviewerId, now),
    db
      .prepare(
        `UPDATE documents
         SET title = ?, description = ?, version = ?, updated = ?, content = ?, updated_at = ?, archived_at = NULL
         WHERE id = ?`,
      )
      .bind(
        document.title,
        description,
        document.version,
        document.updated,
        content,
        now,
        document.id,
      ),
  ]);
  return { created: false };
}

/** Oculta un documento (sus comentarios se conservan). Devuelve si existía y estaba visible. */
export async function archiveDocument(
  db: D1Database,
  id: string,
  now: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      'UPDATE documents SET archived_at = ? WHERE id = ? AND archived_at IS NULL',
    )
    .bind(now, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

const DEFAULT_SPACE: SpaceInfo = { name: 'Documentos' };

export async function findSpace(db: D1Database): Promise<SpaceInfo> {
  const row = await db
    .prepare("SELECT value FROM settings WHERE key = 'space'")
    .first<{ value: string }>();
  if (!row) return DEFAULT_SPACE;
  try {
    return JSON.parse(row.value) as SpaceInfo;
  } catch {
    return DEFAULT_SPACE;
  }
}

export async function saveSpace(
  db: D1Database,
  space: SpaceInfo,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('space', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .bind(JSON.stringify(space))
    .run();
}
