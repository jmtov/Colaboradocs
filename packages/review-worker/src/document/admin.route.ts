import { validateDocument } from '@colaboradocs/review-core';
import { Hono } from 'hono';
import { archiveDocument, saveDocument } from '@/document/document.queries';
import {
  deleteDraft,
  deleteDraftAtRevision,
  findDraft,
  findDraftAuthorId,
  saveDraft,
} from '@/document/drafts.queries';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse, readJsonObject } from '@/shared/http.utils';

function isRevision(value: unknown, min: number): value is number {
  return Number.isInteger(value) && (value as number) >= min;
}

/** Reemplazar, archivar, guardar borrador y publicar (el guard de `/admin/*` está en `index.ts`). */
export const documentAdminRoute = new Hono<AppEnv>()
  .put('/admin/documents/:id', async (c) => {
    const id = c.req.param('id');
    const body = await readJsonObject(c);
    if (!body)
      return errorResponse(c, 'invalid_request', ['El cuerpo no es JSON.']);
    const result = validateDocument(body);
    if (!result.ok) return errorResponse(c, 'invalid_request', result.errors);
    if (result.value.id !== id) {
      return errorResponse(c, 'invalid_request', [
        'El id del documento no coincide con el de la ruta.',
      ]);
    }
    const saved = await saveDocument(
      c.env.DB,
      result.value,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return c.json(saved, saved.created ? 201 : 200);
  })

  .delete('/admin/documents/:id', async (c) => {
    const archived = await archiveDocument(
      c.env.DB,
      c.req.param('id'),
      new Date().toISOString(),
    );
    return archived ? c.body(null, 204) : errorResponse(c, 'not_found');
  })

  // --- Borrador y publicación ---

  .get('/admin/documents/:id/draft', async (c) => {
    const draft = await findDraft(c.env.DB, c.req.param('id'));
    return draft ? c.json(draft) : errorResponse(c, 'not_found');
  })

  .put('/admin/documents/:id/draft', async (c) => {
    const body = await readJsonObject(c);
    if (!body)
      return errorResponse(c, 'invalid_request', ['El cuerpo no es JSON.']);
    if (!isRevision(body.expectedRevision, 0)) {
      return errorResponse(c, 'invalid_request', [
        '«expectedRevision» tiene que ser un entero desde 0.',
      ]);
    }
    const result = validateDocument(body.content);
    if (!result.ok) return errorResponse(c, 'invalid_request', result.errors);
    if (result.value.id !== c.req.param('id')) {
      return errorResponse(c, 'invalid_request', [
        'El id del documento no coincide con el de la ruta.',
      ]);
    }
    const saved = await saveDraft(
      c.env.DB,
      result.value,
      body.expectedRevision,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return saved ? c.json(saved) : errorResponse(c, 'conflict');
  })

  .delete('/admin/documents/:id/draft', async (c) => {
    const discarded = await deleteDraft(c.env.DB, c.req.param('id'));
    return discarded ? c.body(null, 204) : errorResponse(c, 'not_found');
  })

  .post('/admin/documents/:id/publish', async (c) => {
    const id = c.req.param('id');
    const body = await readJsonObject(c);
    if (!body)
      return errorResponse(c, 'invalid_request', ['El cuerpo no es JSON.']);
    if (!isRevision(body.expectedRevision, 1)) {
      return errorResponse(c, 'invalid_request', [
        '«expectedRevision» tiene que ser un entero desde 1.',
      ]);
    }
    const caller = c.get('reviewer');
    // El agente publica solo lo que él mismo dejó como último guardado y sin forzar:
    // si un admin tocó el borrador después, o el documento cambió, decide un admin.
    if (!caller.isAdmin && body.force === true) {
      return errorResponse(c, 'forbidden');
    }
    const draft = await findDraft(c.env.DB, id);
    if (!draft) return errorResponse(c, 'not_found');
    if (
      !caller.isAdmin &&
      (await findDraftAuthorId(c.env.DB, id)) !== caller.id
    ) {
      return errorResponse(c, 'forbidden');
    }
    if (draft.revision !== body.expectedRevision) {
      return errorResponse(c, 'conflict');
    }
    if (draft.stale && body.force !== true) {
      return errorResponse(c, 'draft_stale');
    }
    const saved = await saveDocument(
      c.env.DB,
      draft.content,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    await deleteDraftAtRevision(c.env.DB, id, draft.revision);
    return c.json(saved, saved.created ? 201 : 200);
  });
