import { env, SELF } from 'cloudflare:test';
import { generatePin, hashPin } from '@juntanza/review-core';

export const DOCUMENT = 'principios';
export const DEVICE_A = 'device-aaaaaaaaaaaaaaaa';
export const DEVICE_B = 'device-bbbbbbbbbbbbbbbb';
export const DEVICE_C = 'device-cccccccccccccccc';

export type TestReviewer = {
  id: string;
  name: string;
  pin: string;
};

export async function createReviewer(
  name: string,
  options: {
    isAdmin?: boolean;
    maxDevices?: number;
    municipality?: string;
    promotedBy?: string;
  } = {},
): Promise<TestReviewer> {
  const pin = generatePin();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO reviewers (id, name, pin_hash, is_admin, max_devices, municipality, promoted_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      name,
      await hashPin(pin, env.TOKEN_SECRET),
      options.isAdmin ? 1 : 0,
      options.maxDevices ?? 2,
      options.municipality ?? null,
      options.promotedBy ?? null,
      new Date().toISOString(),
    )
    .run();
  return { id, name, pin };
}

export function api(path: string, init: RequestInit = {}) {
  return SELF.fetch(`https://juntanza.test/api${path}`, init);
}

export async function login(pin: string, deviceId = DEVICE_A) {
  return api('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, deviceId }),
  });
}

export async function tokenFor(reviewer: TestReviewer, deviceId = DEVICE_A) {
  const response = await login(reviewer.pin, deviceId);
  const body = (await response.json()) as { token: string };
  return body.token;
}

export function authed(token: string, path: string, init: RequestInit = {}) {
  return api(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export function postComment(
  token: string,
  body: { blockId: string; text: string; parentId?: string | null },
) {
  return authed(token, `/documents/${DOCUMENT}/comments`, {
    method: 'POST',
    body: JSON.stringify({ blockExcerpt: 'extracto', parentId: null, ...body }),
  });
}

/** Los nombres son únicos y la base se comparte: vacía todo para empezar de cero. */
export async function resetDatabase() {
  for (const table of [
    'approvals',
    'comments',
    'devices',
    'login_failures',
    'document_versions',
    'documents',
    'settings',
  ]) {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  }
  await env.DB.prepare('UPDATE reviewers SET promoted_by = NULL').run();
  await env.DB.prepare('DELETE FROM reviewers').run();
}
