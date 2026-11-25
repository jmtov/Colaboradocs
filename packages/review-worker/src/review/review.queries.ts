import type {
  BlockApproval,
  NewComment,
  ReviewComment,
} from '@colaboradocs/review-core';

type CommentRow = {
  id: string;
  block_id: string;
  parent_id: string | null;
  reviewer_id: string;
  author_name: string;
  author_municipality: string | null;
  text: string | null;
  block_excerpt: string;
  resolved_at: string | null;
  created_at: string;
};

const COMMENT_SELECT = `
  SELECT c.id, c.block_id, c.parent_id, c.reviewer_id, r.name AS author_name, r.municipality AS author_municipality,
         c.text, c.block_excerpt, c.resolved_at, c.created_at
  FROM comments c
  JOIN reviewers r ON r.id = c.reviewer_id`;

function toComment(row: CommentRow): ReviewComment {
  return {
    id: row.id,
    blockId: row.block_id,
    parentId: row.parent_id,
    authorId: row.reviewer_id,
    authorName: row.author_name,
    authorMunicipality: row.author_municipality,
    text: row.text,
    blockExcerpt: row.block_excerpt,
    createdAt: row.created_at,
    resolved: row.resolved_at !== null,
  };
}

export async function listComments(
  db: D1Database,
  documentId: string,
): Promise<ReviewComment[]> {
  const { results } = await db
    .prepare(`${COMMENT_SELECT} WHERE c.document_id = ? ORDER BY c.created_at`)
    .bind(documentId)
    .all<CommentRow>();
  return results.map(toComment);
}

export async function findComment(
  db: D1Database,
  documentId: string,
  commentId: string,
): Promise<ReviewComment | null> {
  const row = await db
    .prepare(`${COMMENT_SELECT} WHERE c.document_id = ? AND c.id = ?`)
    .bind(documentId, commentId)
    .first<CommentRow>();
  return row ? toComment(row) : null;
}

export async function insertComment(
  db: D1Database,
  documentId: string,
  reviewerId: string,
  comment: NewComment,
  id: string,
  now: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO comments
         (id, document_id, block_id, parent_id, reviewer_id, text, block_excerpt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      documentId,
      comment.blockId,
      comment.parentId,
      reviewerId,
      comment.text,
      comment.blockExcerpt,
      now,
    )
    .run();
}

/** Borrado suave: el hilo conserva su forma y el texto queda en null. */
export async function clearCommentText(
  db: D1Database,
  commentId: string,
): Promise<void> {
  await db
    .prepare('UPDATE comments SET text = NULL WHERE id = ?')
    .bind(commentId)
    .run();
}

export async function setCommentResolved(
  db: D1Database,
  commentId: string,
  resolvedAt: string | null,
): Promise<void> {
  await db
    .prepare('UPDATE comments SET resolved_at = ? WHERE id = ?')
    .bind(resolvedAt, commentId)
    .run();
}

export async function listApprovals(
  db: D1Database,
  documentId: string,
): Promise<BlockApproval[]> {
  const { results } = await db
    .prepare(
      'SELECT block_id, reviewer_id, created_at FROM approvals WHERE document_id = ?',
    )
    .bind(documentId)
    .all<{ block_id: string; reviewer_id: string; created_at: string }>();
  return results.map((row) => ({
    blockId: row.block_id,
    reviewerId: row.reviewer_id,
    createdAt: row.created_at,
  }));
}

export async function addApproval(
  db: D1Database,
  documentId: string,
  blockId: string,
  reviewerId: string,
  now: string,
): Promise<void> {
  await db
    .prepare(
      'INSERT OR IGNORE INTO approvals (document_id, block_id, reviewer_id, created_at) VALUES (?, ?, ?, ?)',
    )
    .bind(documentId, blockId, reviewerId, now)
    .run();
}

export async function removeApproval(
  db: D1Database,
  documentId: string,
  blockId: string,
  reviewerId: string,
): Promise<void> {
  await db
    .prepare(
      'DELETE FROM approvals WHERE document_id = ? AND block_id = ? AND reviewer_id = ?',
    )
    .bind(documentId, blockId, reviewerId)
    .run();
}
