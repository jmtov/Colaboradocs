import { createMiddleware } from 'hono/factory';
import { findReviewerForDevice } from '../db/reviewers.queries';
import type { AppEnv } from '../env.types';
import { errorResponse } from '../http.utils';
import { verifyToken } from './token.utils';

/** Además de la sesión, exige que la persona sea admin. */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('reviewer').isAdmin) return errorResponse(c, 'forbidden');
  await next();
});

/**
 * Exige un token válido y que el revisor siga activo en ese dispositivo
 * (revocar un PIN o resetear sus dispositivos corta el acceso al instante).
 */
export const requireReviewer = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token
    ? await verifyToken(token, c.env.TOKEN_SECRET, Date.now())
    : null;
  if (!payload) return errorResponse(c, 'unauthorized');

  const reviewer = await findReviewerForDevice(
    c.env.DB,
    payload.reviewerId,
    payload.deviceId,
  );
  if (!reviewer) return errorResponse(c, 'unauthorized');

  c.set('reviewer', reviewer);
  await next();
});
