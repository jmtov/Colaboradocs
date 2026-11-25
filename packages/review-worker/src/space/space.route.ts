import { validateSpace } from '@colaboradocs/review-core';
import { Hono } from 'hono';
import { findSpace, saveSpace } from '@/document/document.queries';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse, readJsonObject } from '@/shared/http.utils';

/** Nombre y rol del espacio: públicos, porque la puerta del PIN los muestra. */
export const spaceRoute = new Hono<AppEnv>()
  .get('/space', async (c) => c.json(await findSpace(c.env.DB)))

  // Cambiarlo es de admins: el guard de `/admin/*` está en `index.ts`.
  .put('/admin/space', async (c) => {
    const result = validateSpace(await readJsonObject(c));
    if (!result.ok) return errorResponse(c, 'invalid_request', result.errors);
    await saveSpace(c.env.DB, result.value);
    return c.json(result.value);
  });
