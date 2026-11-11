import { Hono } from 'hono';
import { findSpace } from '@/db/documents.queries';
import type { AppEnv } from '@/env.types';

/** Nombre y rol del espacio: públicos, porque la puerta del PIN los muestra. */
export const spaceRoute = new Hono<AppEnv>().get('/space', async (c) =>
  c.json(await findSpace(c.env.DB)),
);
