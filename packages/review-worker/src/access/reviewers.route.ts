import {
  formatPin,
  generatePin,
  hashPin,
  type IssuedPin,
  lockedReviewerIds,
  MAX_NAME_LENGTH,
  MAX_ROLE_LENGTH,
  type ManagedReviewer,
} from '@colaboradocs/review-core';
import { Hono } from 'hono';
import {
  findStoredReviewer,
  findStoredReviewerByName,
  insertReviewer,
  listStoredReviewers,
  reactivateReviewer,
  replacePin,
  resetDevices,
  revokeReviewer,
  type StoredReviewer,
  toAccessNodes,
  toManaged,
  updateAdmin,
  updateMaxDevices,
  updateMunicipality,
} from '@/access/access.queries';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse, readJsonObject } from '@/shared/http.utils';

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text && text.length <= max ? text : null;
}

/**
 * Pantalla de accesos: solo admins (el guard de `/admin/*` está en `index.ts`).
 * Las reglas de la cadena se validan aquí, no en la UI.
 */
export const reviewersRoute = new Hono<AppEnv>()
  .get('/admin/reviewers', async (c) => {
    const people = await listStoredReviewers(c.env.DB);
    const locked = lockedReviewerIds(
      toAccessNodes(people),
      c.get('reviewer').id,
    );
    const managed: ManagedReviewer[] = people
      .filter((person) => !person.revoked)
      .map((person) => toManaged(person, locked.has(person.id)));
    return c.json(managed);
  })

  .post('/admin/reviewers', async (c) => {
    const body = await readJsonObject(c);
    const name = cleanText(body?.name, MAX_NAME_LENGTH);
    const municipality = cleanText(body?.municipality, MAX_ROLE_LENGTH);
    if (!name || !municipality || typeof body?.isAdmin !== 'boolean') {
      return errorResponse(c, 'invalid_request');
    }

    const caller = c.get('reviewer');
    const existing = await findStoredReviewerByName(c.env.DB, name);
    if (existing && !existing.revoked) return errorResponse(c, 'name_taken');

    const pin = generatePin();
    const pinHash = await hashPin(pin, c.env.TOKEN_SECRET);
    const promotedBy = body.isAdmin ? caller.id : null;
    let id: string;
    if (existing) {
      id = existing.id;
      await reactivateReviewer(c.env.DB, {
        id,
        pinHash,
        municipality,
        isAdmin: body.isAdmin,
        promotedBy,
      });
    } else {
      id = crypto.randomUUID();
      await insertReviewer(c.env.DB, {
        id,
        name,
        pinHash,
        municipality,
        isAdmin: body.isAdmin,
        promotedBy,
        now: new Date().toISOString(),
      });
    }
    const created = await findStoredReviewer(c.env.DB, id);
    if (!created) return errorResponse(c, 'not_found');
    const issued: IssuedPin = {
      reviewer: toManaged(created, false),
      pin: formatPin(pin),
    };
    return c.json(issued, 201);
  })

  .patch('/admin/reviewers/:id', async (c) => {
    const { person, locked } = await target(c);
    if (!person) return errorResponse(c, 'not_found');
    const body = await readJsonObject(c);
    const hasRole = body !== null && 'municipality' in body;
    const hasAdmin = body !== null && 'isAdmin' in body;
    const hasMax = body !== null && 'maxDevices' in body;
    if (!hasRole && !hasAdmin && !hasMax) {
      return errorResponse(c, 'invalid_request');
    }
    const maxDevices = body?.maxDevices;
    if (
      hasMax &&
      !(
        typeof maxDevices === 'number' &&
        Number.isInteger(maxDevices) &&
        maxDevices >= 1 &&
        maxDevices <= 10
      )
    ) {
      return errorResponse(c, 'invalid_request');
    }

    const municipality = hasRole
      ? cleanText(body?.municipality, MAX_ROLE_LENGTH)
      : null;
    if (hasRole && !municipality) return errorResponse(c, 'invalid_request');
    if (hasAdmin && typeof body?.isAdmin !== 'boolean') {
      return errorResponse(c, 'invalid_request');
    }
    // Un agente no se asciende a admin: es un rol aparte, con permisos acotados.
    if (hasAdmin && body?.isAdmin === true && person.isAgent) {
      return errorResponse(c, 'forbidden');
    }
    // Cambiar el nivel de acceso de alguien bloqueado queda fuera; el rol es solo una etiqueta.
    if (hasAdmin && body?.isAdmin !== person.isAdmin && locked) {
      return errorResponse(c, 'forbidden');
    }

    if (municipality)
      await updateMunicipality(c.env.DB, person.id, municipality);
    if (hasMax && typeof maxDevices === 'number') {
      await updateMaxDevices(c.env.DB, person.id, maxDevices);
    }
    if (
      hasAdmin &&
      typeof body?.isAdmin === 'boolean' &&
      body.isAdmin !== person.isAdmin
    ) {
      await updateAdmin(
        c.env.DB,
        person.id,
        body.isAdmin,
        c.get('reviewer').id,
      );
    }
    return c.body(null, 204);
  })

  .delete('/admin/reviewers/:id', async (c) => {
    const { person, locked } = await target(c);
    if (!person) return errorResponse(c, 'not_found');
    if (locked) return errorResponse(c, 'forbidden');
    await revokeReviewer(c.env.DB, person.id, new Date().toISOString());
    return c.body(null, 204);
  })

  .post('/admin/reviewers/:id/pin', async (c) => {
    const { person, locked } = await target(c);
    if (!person) return errorResponse(c, 'not_found');
    if (locked) return errorResponse(c, 'forbidden');
    const pin = generatePin();
    await replacePin(
      c.env.DB,
      person.id,
      await hashPin(pin, c.env.TOKEN_SECRET),
    );
    const updated = await findStoredReviewer(c.env.DB, person.id);
    if (!updated) return errorResponse(c, 'not_found');
    const issued: IssuedPin = {
      reviewer: toManaged(updated, false),
      pin: formatPin(pin),
    };
    return c.json(issued);
  })

  .post('/admin/reviewers/:id/devices/reset', async (c) => {
    const { person, locked } = await target(c);
    if (!person) return errorResponse(c, 'not_found');
    if (locked) return errorResponse(c, 'forbidden');
    await resetDevices(c.env.DB, person.id);
    return c.body(null, 204);
  });

/** La persona del :id (si existe y no está eliminada) y si quien consulta la tiene bloqueada. */
async function target(c: {
  env: AppEnv['Bindings'];
  req: { param: (name: string) => string };
  get: (key: 'reviewer') => AppEnv['Variables']['reviewer'];
}): Promise<{ person: StoredReviewer | null; locked: boolean }> {
  const people = await listStoredReviewers(c.env.DB);
  const person = people.find((item) => item.id === c.req.param('id'));
  if (!person || person.revoked) return { person: null, locked: false };
  const locked = lockedReviewerIds(toAccessNodes(people), c.get('reviewer').id);
  return { person, locked: locked.has(person.id) };
}
