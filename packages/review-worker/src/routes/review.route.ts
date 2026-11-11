import {
  EXCERPT_LENGTH,
  MAX_COMMENT_LENGTH,
  type NewComment,
  type ReviewSnapshot,
} from '@juntanza/review-core';
import { Hono } from 'hono';
import { requireReviewer } from '@/auth/auth.middleware';
import {
  findDocument,
  listDocuments,
  listDocumentVersions,
} from '@/db/documents.queries';
import {
  addApproval,
  clearCommentText,
  findComment,
  insertComment,
  listApprovals,
  listComments,
  removeApproval,
  setCommentResolved,
} from '@/db/review.queries';
import { listReviewerLabels } from '@/db/reviewers.queries';
import type { AppEnv } from '@/env.types';
import { errorResponse, readJsonObject } from '@/http.utils';

const DOCUMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const BLOCK_ID_PATTERN = /^[a-z0-9-]{1,100}$/;

export const reviewRoute = new Hono<AppEnv>()
  // La home: los documentos y su actividad (no cuelga de uno solo).
  .get('/documents', requireReviewer, async (c) =>
    c.json(await listDocuments(c.env.DB)),
  )
  .use('/documents/:documentId/*', requireReviewer)
  .use('/documents/:documentId/*', async (c, next) => {
    if (!DOCUMENT_ID_PATTERN.test(c.req.param('documentId') ?? '')) {
      return errorResponse(c, 'not_found');
    }
    await next();
  })

  .get('/documents/:documentId/content', async (c) => {
    const document = await findDocument(c.env.DB, c.req.param('documentId'));
    return document ? c.json(document) : errorResponse(c, 'not_found');
  })

  .get('/documents/:documentId/versions', async (c) => {
    const versions = await listDocumentVersions(
      c.env.DB,
      c.req.param('documentId'),
    );
    return versions ? c.json(versions) : errorResponse(c, 'not_found');
  })

  .get('/documents/:documentId/review', async (c) => {
    const documentId = c.req.param('documentId');
    const snapshot: ReviewSnapshot = {
      me: c.get('reviewer'),
      comments: await listComments(c.env.DB, documentId),
      approvals: await listApprovals(c.env.DB, documentId),
      reviewers: await listReviewerLabels(c.env.DB),
    };
    return c.json(snapshot);
  })

  .post('/documents/:documentId/comments', async (c) => {
    const documentId = c.req.param('documentId');
    const body = await readJsonObject(c);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const blockId = body?.blockId;
    const parentId = body?.parentId ?? null;
    const excerpt =
      typeof body?.blockExcerpt === 'string' ? body.blockExcerpt : '';
    if (
      !text ||
      text.length > MAX_COMMENT_LENGTH ||
      typeof blockId !== 'string' ||
      !BLOCK_ID_PATTERN.test(blockId) ||
      (parentId !== null && typeof parentId !== 'string')
    ) {
      return errorResponse(c, 'invalid_request');
    }

    if (parentId !== null) {
      const parent = await findComment(c.env.DB, documentId, parentId);
      if (!parent || parent.blockId !== blockId) {
        return errorResponse(c, 'invalid_request');
      }
    }

    const comment: NewComment = {
      blockId,
      parentId,
      text,
      blockExcerpt: excerpt.slice(0, EXCERPT_LENGTH),
    };
    const id = crypto.randomUUID();
    await insertComment(
      c.env.DB,
      documentId,
      c.get('reviewer').id,
      comment,
      id,
      new Date().toISOString(),
    );
    const created = await findComment(c.env.DB, documentId, id);
    return c.json(created, 201);
  })

  .delete('/documents/:documentId/comments/:commentId', async (c) => {
    const comment = await findComment(
      c.env.DB,
      c.req.param('documentId'),
      c.req.param('commentId'),
    );
    if (!comment) return errorResponse(c, 'not_found');
    const reviewer = c.get('reviewer');
    if (comment.authorId !== reviewer.id && !reviewer.isAdmin) {
      return errorResponse(c, 'forbidden');
    }
    await clearCommentText(c.env.DB, comment.id);
    return c.body(null, 204);
  })

  .put('/documents/:documentId/comments/:commentId/resolved', async (c) => {
    const comment = await findComment(
      c.env.DB,
      c.req.param('documentId'),
      c.req.param('commentId'),
    );
    if (!comment) return errorResponse(c, 'not_found');
    const reviewer = c.get('reviewer');
    if (comment.parentId !== null) return errorResponse(c, 'invalid_request');
    if (comment.authorId !== reviewer.id && !reviewer.isAdmin) {
      return errorResponse(c, 'forbidden');
    }
    const body = await readJsonObject(c);
    if (typeof body?.resolved !== 'boolean') {
      return errorResponse(c, 'invalid_request');
    }
    await setCommentResolved(
      c.env.DB,
      comment.id,
      body.resolved ? new Date().toISOString() : null,
    );
    return c.body(null, 204);
  })

  .put('/documents/:documentId/approvals/:blockId', async (c) => {
    const blockId = c.req.param('blockId');
    if (!BLOCK_ID_PATTERN.test(blockId))
      return errorResponse(c, 'invalid_request');
    await addApproval(
      c.env.DB,
      c.req.param('documentId'),
      blockId,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return c.body(null, 204);
  })

  .delete('/documents/:documentId/approvals/:blockId', async (c) => {
    const blockId = c.req.param('blockId');
    if (!BLOCK_ID_PATTERN.test(blockId))
      return errorResponse(c, 'invalid_request');
    await removeApproval(
      c.env.DB,
      c.req.param('documentId'),
      blockId,
      c.get('reviewer').id,
    );
    return c.body(null, 204);
  });
