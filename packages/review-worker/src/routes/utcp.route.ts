import { Hono } from 'hono';
import type { AppEnv } from '@/env.types';
import { buildManual } from '@/utcp/utcp.utils';

/**
 * Manual UTCP: público, porque solo describe rutas (el código es abierto) y no lleva
 * secretos. Cada herramienta pide el token por su cuenta.
 */
export const utcpRoute = new Hono<AppEnv>().get('/utcp', (c) =>
  c.json(buildManual(new URL(c.req.url).origin)),
);
