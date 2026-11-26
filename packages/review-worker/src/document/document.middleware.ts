import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse } from '@/shared/http.utils';

const DOCUMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

/** Un id de documento con forma inválida es un documento que no existe: no se lee ni se escribe. */
export const requireDocumentId = createMiddleware<AppEnv>(async (c, next) => {
  if (!DOCUMENT_ID_PATTERN.test(c.req.param('documentId') ?? '')) {
    return errorResponse(c, 'not_found');
  }
  await next();
});
