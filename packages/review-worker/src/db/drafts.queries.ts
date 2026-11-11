import type {
  DocumentContent,
  DocumentDraft,
  DraftInfo,
} from '@colaboradocs/review-core';

type DraftRow = {
  content: string;
  revision: number;
  base_updated_at: string | null;
  updated_at: string;
  name: string | null;
  municipality: string | null;
  current_updated_at: string | null;
};

/**
 * El documento publicado (aunque esté archivado) cambió desde que se creó el
 * borrador. Un documento que no existía al empezar y ahora sí, también.
 */
function isStale(base: string | null, current: string | null): boolean {
  return base !== current;
}

function toInfo(row: DraftRow): DraftInfo {
  return {
    revision: row.revision,
    updatedAt: row.updated_at,
    updatedBy: row.name
      ? { name: row.name, municipality: row.municipality }
      : null,
    baseUpdatedAt: row.base_updated_at,
    stale: isStale(row.base_updated_at, row.current_updated_at),
  };
}

const SELECT_DRAFT = `
  SELECT g.content, g.revision, g.base_updated_at, g.updated_at,
         r.name, r.municipality, d.updated_at AS current_updated_at
  FROM document_drafts g
  LEFT JOIN reviewers r ON r.id = g.updated_by
  LEFT JOIN documents d ON d.id = g.document_id
  WHERE g.document_id = ?`;

/** El borrador de un documento, o null si no hay. */
export async function findDraft(
  db: D1Database,
  documentId: string,
): Promise<DocumentDraft | null> {
  const row = await db.prepare(SELECT_DRAFT).bind(documentId).first<DraftRow>();
  if (!row) return null;
  return {
    ...toInfo(row),
    content: JSON.parse(row.content) as DocumentContent,
  };
}

/**
 * Guarda el borrador si `expectedRevision` es la que hay (0 = no hay
 * borrador). Devuelve null si alguien guardó antes: nada se pisa.
 */
export async function saveDraft(
  db: D1Database,
  content: DocumentContent,
  expectedRevision: number,
  reviewerId: string,
  now: string,
): Promise<DraftInfo | null> {
  const json = JSON.stringify(content);
  let changes: number;
  if (expectedRevision === 0) {
    const result = await db
      .prepare(
        `INSERT OR IGNORE INTO document_drafts (document_id, content, revision, base_updated_at, updated_by, updated_at)
         VALUES (?, ?, 1, (SELECT updated_at FROM documents WHERE id = ?), ?, ?)`,
      )
      .bind(content.id, json, content.id, reviewerId, now)
      .run();
    changes = result.meta.changes ?? 0;
  } else {
    const result = await db
      .prepare(
        `UPDATE document_drafts
         SET content = ?, revision = revision + 1, updated_by = ?, updated_at = ?
         WHERE document_id = ? AND revision = ?`,
      )
      .bind(json, reviewerId, now, content.id, expectedRevision)
      .run();
    changes = result.meta.changes ?? 0;
  }
  if (changes === 0) return null;
  const saved = await db
    .prepare(SELECT_DRAFT)
    .bind(content.id)
    .first<DraftRow>();
  return saved ? toInfo(saved) : null;
}

/** Descarta el borrador. Devuelve si había uno. */
export async function deleteDraft(
  db: D1Database,
  documentId: string,
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM document_drafts WHERE document_id = ?')
    .bind(documentId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/**
 * Borra el borrador solo si sigue en esa revisión: si alguien guardó mientras
 * se publicaba, su guardado queda (y se ve como borrador viejo).
 */
export async function deleteDraftAtRevision(
  db: D1Database,
  documentId: string,
  revision: number,
): Promise<void> {
  await db
    .prepare(
      'DELETE FROM document_drafts WHERE document_id = ? AND revision = ?',
    )
    .bind(documentId, revision)
    .run();
}
