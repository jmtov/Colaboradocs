import { Hono } from 'hono';
import { requireReviewer } from '@/access/auth.middleware';
import {
  findDocument,
  listDocuments,
  listDocumentVersions,
} from '@/document/document.queries';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse } from '@/shared/http.utils';

/**
 * Leer documentos. La sesión y el id de `/documents/:documentId/*` los exige `index.ts`; la lista
 * no cuelga de un documento y pide la sesión aquí.
 */
export const documentRoute = new Hono<AppEnv>()
  // La home: los documentos y su actividad (no cuelga de uno solo).
  // `?archived=1` trae los archivados y es de admins.
  .get('/documents', requireReviewer, async (c) => {
    if (c.req.query('archived') === '1') {
      if (!c.get('reviewer').isAdmin) return errorResponse(c, 'forbidden');
      return c.json(await listDocuments(c.env.DB, { archived: true }));
    }
    return c.json(await listDocuments(c.env.DB));
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
  });
