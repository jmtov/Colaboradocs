import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../src/auth/token.utils';
import {
  api,
  authed,
  createReviewer,
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  login,
  tokenFor,
} from './helpers';

describe('token', () => {
  const payload = { reviewerId: 'r1', deviceId: 'd1', expiresAt: 2_000 };

  it('verifica un token propio y rechaza uno alterado o vencido', async () => {
    const token = await signToken(payload, 'secreto');
    expect(await verifyToken(token, 'secreto', 1_000)).toEqual(payload);
    expect(await verifyToken(token, 'otro-secreto', 1_000)).toBeNull();
    expect(await verifyToken(token, 'secreto', 2_000)).toBeNull();
    expect(await verifyToken(`${token}x`, 'secreto', 1_000)).toBeNull();
    expect(await verifyToken('basura', 'secreto', 1_000)).toBeNull();
  });
});

describe('POST /api/login', () => {
  it('canjea un PIN válido (con o sin guion y en minúsculas)', async () => {
    const ana = await createReviewer('Ana');
    const formatted =
      `${ana.pin.slice(0, 4)}-${ana.pin.slice(4)}`.toLowerCase();
    const response = await login(formatted);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      token: string;
      reviewer: { name: string; isAdmin: boolean };
    };
    expect(body.reviewer).toMatchObject({ name: 'Ana', isAdmin: false });
    expect(body.token).toContain('.');
  });

  it('rechaza un PIN desconocido', async () => {
    const response = await login('ABCD-EFGH');
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'invalid_pin' });
  });

  it('rechaza una petición mal formada', async () => {
    const response = await api('/login', { method: 'POST', body: '{"pin":1}' });
    expect(response.status).toBe(400);
  });

  it('limita los dispositivos por PIN y deja volver al mismo', async () => {
    const luis = await createReviewer('Luis', { maxDevices: 2 });
    expect((await login(luis.pin, DEVICE_A)).status).toBe(200);
    expect((await login(luis.pin, DEVICE_B)).status).toBe(200);
    const third = await login(luis.pin, DEVICE_C);
    expect(third.status).toBe(403);
    expect(await third.json()).toEqual({ error: 'device_limit' });
    expect((await login(luis.pin, DEVICE_A)).status).toBe(200);
  });

  it('no deja entrar a un PIN revocado', async () => {
    const eva = await createReviewer('Eva');
    await env.DB.prepare('UPDATE reviewers SET revoked_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), eva.id)
      .run();
    expect((await login(eva.pin)).status).toBe(401);
  });

  it('bloquea tras demasiados intentos fallidos de una misma IP', async () => {
    const ip = { 'CF-Connecting-IP': '203.0.113.9' };
    const attempt = () =>
      api('/login', {
        method: 'POST',
        headers: ip,
        body: JSON.stringify({ pin: 'ZZZZ-ZZZZ', deviceId: DEVICE_A }),
      });
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'too_many_attempts' });
  });
});

describe('acceso con token', () => {
  it('exige token y corta el acceso al revocar el PIN', async () => {
    const eva = await createReviewer('Eva2');
    expect((await api('/documents/principios/review')).status).toBe(401);
    const token = await tokenFor(eva);
    expect((await authed(token, '/documents/principios/review')).status).toBe(
      200,
    );

    await env.DB.prepare('UPDATE reviewers SET revoked_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), eva.id)
      .run();
    expect((await authed(token, '/documents/principios/review')).status).toBe(
      401,
    );
  });

  it('corta el acceso al resetear los dispositivos', async () => {
    const tomas = await createReviewer('Tomás');
    const token = await tokenFor(tomas);
    await env.DB.prepare('DELETE FROM devices WHERE reviewer_id = ?')
      .bind(tomas.id)
      .run();
    expect((await authed(token, '/documents/principios/review')).status).toBe(
      401,
    );
  });
});
