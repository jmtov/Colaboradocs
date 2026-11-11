import type { IssuedPin, ManagedReviewer } from '@colaboradocs/review-core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  authed,
  createReviewer,
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DOCUMENT,
  login,
  postComment,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

beforeEach(resetDatabase);

async function list(token: string) {
  const response = await authed(token, '/admin/reviewers');
  expect(response.status).toBe(200);
  return (await response.json()) as ManagedReviewer[];
}

function add(
  token: string,
  body: { name: string; municipality: string; isAdmin: boolean },
) {
  return authed(token, '/admin/reviewers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function addOk(
  token: string,
  body: { name: string; municipality: string; isAdmin: boolean },
) {
  const response = await add(token, body);
  expect(response.status).toBe(201);
  return (await response.json()) as IssuedPin;
}

/** Entra con el PIN de una persona recién creada. */
async function enter(issued: IssuedPin, deviceId = DEVICE_A) {
  const reviewer: TestReviewer = {
    id: issued.reviewer.id,
    name: issued.reviewer.name,
    pin: issued.pin,
  };
  return tokenFor(reviewer, deviceId);
}

const patch = (token: string, id: string, body: object) =>
  authed(token, `/admin/reviewers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
const remove = (token: string, id: string) =>
  authed(token, `/admin/reviewers/${id}`, { method: 'DELETE' });

describe('acceso a la pantalla de accesos', () => {
  it('exige sesión y ser admin', async () => {
    const member = await createReviewer('Miembro');
    const memberToken = await tokenFor(member);
    expect((await authed(memberToken, '/admin/reviewers')).status).toBe(403);
    expect(
      (await add(memberToken, { name: 'X', municipality: 'Y', isAdmin: false }))
        .status,
    ).toBe(403);
    const anonymous = await authed('nada', '/admin/reviewers');
    expect(anonymous.status).toBe(401);
  });
});

describe('listar y agregar', () => {
  it('lista a las personas con su rol, dispositivos y si están bloqueadas', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    await createReviewer('Ana', { municipality: 'La Ceja' });
    const token = await tokenFor(root);
    const people = await list(token);
    const me = people.find((p) => p.id === root.id);
    expect(me).toMatchObject({
      isAdmin: true,
      municipality: 'Rionegro',
      devices: 1,
      locked: true,
    });
    expect(people.find((p) => p.name === 'Ana')).toMatchObject({
      isAdmin: false,
      locked: false,
      maxDevices: 2,
    });
  });

  it('agrega a alguien y entrega un PIN que funciona; el PIN no vuelve a salir', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const token = await tokenFor(root);
    const issued = await addOk(token, {
      name: '  Luis   Pérez ',
      municipality: 'Guarne',
      isAdmin: false,
    });
    expect(issued.reviewer).toMatchObject({
      name: 'Luis Pérez',
      municipality: 'Guarne',
      isAdmin: false,
    });
    expect(issued.pin).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect((await login(issued.pin)).status).toBe(200);
    expect(JSON.stringify(await list(token))).not.toContain(issued.pin);
  });

  it('exige nombre y rol, y rechaza nombres repetidos', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const token = await tokenFor(root);
    expect(
      (await add(token, { name: '', municipality: 'X', isAdmin: false }))
        .status,
    ).toBe(400);
    expect(
      (await add(token, { name: 'Y', municipality: '  ', isAdmin: false }))
        .status,
    ).toBe(400);
    expect(
      (
        await authed(token, '/admin/reviewers', {
          method: 'POST',
          body: JSON.stringify({ name: 'Y', municipality: 'X' }),
        })
      ).status,
    ).toBe(400);
    await addOk(token, {
      name: 'Ana',
      municipality: 'La Ceja',
      isAdmin: false,
    });
    const repeated = await add(token, {
      name: 'Ana',
      municipality: 'Otro',
      isAdmin: false,
    });
    expect(repeated.status).toBe(409);
    expect(await repeated.json()).toEqual({ error: 'name_taken' });
  });
});

describe('cadena de admins', () => {
  async function chain() {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const rootToken = await tokenFor(root);
    const b = await addOk(rootToken, {
      name: 'B',
      municipality: 'Guarne',
      isAdmin: true,
    });
    const bToken = await enter(b);
    const c = await addOk(bToken, {
      name: 'C',
      municipality: 'Marinilla',
      isAdmin: true,
    });
    const cToken = await enter(c);
    const member = await addOk(bToken, {
      name: 'M',
      municipality: 'El Retiro',
      isAdmin: false,
    });
    return { root, rootToken, b, bToken, c, cToken, member };
  }

  it('nadie se toca a sí mismo ni a quien lo hizo admin, ni a toda esa cadena', async () => {
    const { root, b, bToken, c, cToken } = await chain();
    // C no puede tocar a B (quien lo hizo) ni a la raíz (quien hizo a B), ni a sí mismo
    for (const id of [b.reviewer.id, root.id, c.reviewer.id]) {
      expect((await remove(cToken, id)).status).toBe(403);
      expect((await patch(cToken, id, { isAdmin: false })).status).toBe(403);
      expect(
        (await authed(cToken, `/admin/reviewers/${id}/pin`, { method: 'POST' }))
          .status,
      ).toBe(403);
      expect(
        (
          await authed(cToken, `/admin/reviewers/${id}/devices/reset`, {
            method: 'POST',
          })
        ).status,
      ).toBe(403);
    }
    // B no puede tocar a la raíz ni a sí mismo, pero sí a C
    expect((await remove(bToken, root.id)).status).toBe(403);
    expect((await remove(bToken, b.reviewer.id)).status).toBe(403);
    expect(
      (await patch(bToken, c.reviewer.id, { isAdmin: false })).status,
    ).toBe(204);
  });

  it('la lista marca como bloqueadas a esas personas', async () => {
    const { root, b, cToken, c, member } = await chain();
    const people = await list(cToken);
    const locked = (id: string) => people.find((p) => p.id === id)?.locked;
    expect(locked(root.id)).toBe(true);
    expect(locked(b.reviewer.id)).toBe(true);
    expect(locked(c.reviewer.id)).toBe(true);
    expect(locked(member.reviewer.id)).toBe(false);
  });

  it('un admin puede dar y quitar el acceso a quien no es de su cadena', async () => {
    const { bToken, member } = await chain();
    expect(
      (await patch(bToken, member.reviewer.id, { isAdmin: true })).status,
    ).toBe(204);
    expect(
      (await patch(bToken, member.reviewer.id, { isAdmin: false })).status,
    ).toBe(204);
    expect((await remove(bToken, member.reviewer.id)).status).toBe(204);
    expect(
      (await list(bToken)).find((p) => p.id === member.reviewer.id),
    ).toBeUndefined();
  });

  it('un admin creado por CLI no se toca desde la pantalla, ni por pares', async () => {
    const { rootToken } = await chain();
    const other = await createReviewer('Otra raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    expect((await remove(rootToken, other.id)).status).toBe(403);
  });

  it('al quitar el admin a alguien, a quienes ella hizo admin los hereda su promotor', async () => {
    const { root, rootToken, b, bToken, c, cToken } = await chain();
    expect(
      (await patch(rootToken, b.reviewer.id, { isAdmin: false })).status,
    ).toBe(204);
    // C sigue siendo admin y la raíz sigue protegida para C
    expect((await authed(cToken, '/admin/reviewers')).status).toBe(200);
    expect((await remove(cToken, root.id)).status).toBe(403);
    // B ya no es admin
    expect((await authed(bToken, '/admin/reviewers')).status).toBe(403);
    expect(c.reviewer.isAdmin).toBe(true);
  });
});

describe('editar el rol', () => {
  it('cualquier admin puede cambiarlo, también el suyo; no puede quedar vacío', async () => {
    const root = await createReviewer('Raíz', { isAdmin: true });
    const ana = await createReviewer('Ana');
    const token = await tokenFor(root);
    expect(
      (await patch(token, ana.id, { municipality: 'Carmen de Viboral' }))
        .status,
    ).toBe(204);
    expect(
      (await patch(token, root.id, { municipality: 'Rionegro' })).status,
    ).toBe(204);
    expect((await patch(token, ana.id, { municipality: ' ' })).status).toBe(
      400,
    );
    expect((await patch(token, ana.id, {})).status).toBe(400);
    const people = await list(token);
    expect(people.find((p) => p.id === ana.id)?.municipality).toBe(
      'Carmen de Viboral',
    );
    expect(people.find((p) => p.id === root.id)?.municipality).toBe('Rionegro');
  });
});

describe('PIN y dispositivos', () => {
  it('regenerar invalida el PIN anterior y suelta los dispositivos', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const ana = await createReviewer('Ana', { municipality: 'La Ceja' });
    const token = await tokenFor(root);
    const anaToken = await tokenFor(ana);

    const response = await authed(token, `/admin/reviewers/${ana.id}/pin`, {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    const issued = (await response.json()) as IssuedPin;
    expect(issued.pin).not.toBe(ana.pin);
    expect((await login(ana.pin)).status).toBe(401);
    expect((await login(issued.pin, DEVICE_B)).status).toBe(200);
    // el token del dispositivo viejo ya no sirve
    expect((await authed(anaToken, '/documents/d/review')).status).toBe(401);
  });

  it('restablecer dispositivos deja entrar desde uno nuevo con el mismo PIN', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const ana = await createReviewer('Ana', { municipality: 'La Ceja' });
    const token = await tokenFor(root);
    await tokenFor(ana, DEVICE_A);
    await tokenFor(ana, DEVICE_B);
    expect((await login(ana.pin, DEVICE_C)).status).toBe(403);
    const reset = await authed(
      token,
      `/admin/reviewers/${ana.id}/devices/reset`,
      { method: 'POST' },
    );
    expect(reset.status).toBe(204);
    expect((await login(ana.pin, DEVICE_C)).status).toBe(200);
  });
});

describe('eliminar', () => {
  it('corta el acceso, conserva sus comentarios y permite volver a agregarla', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const token = await tokenFor(root);
    const ana = await addOk(token, {
      name: 'Ana',
      municipality: 'La Ceja',
      isAdmin: false,
    });
    const anaToken = await enter(ana);
    await postComment(anaToken, { blockId: 'a-1', text: 'Hola' });

    expect((await remove(token, ana.reviewer.id)).status).toBe(204);
    expect((await login(ana.pin, DEVICE_B)).status).toBe(401);
    expect((await authed(anaToken, '/documents/d/review')).status).toBe(401);
    expect((await list(token)).some((p) => p.name === 'Ana')).toBe(false);
    const snapshot = (await (
      await authed(token, `/documents/${DOCUMENT}/review`)
    ).json()) as { comments: { authorName: string; text: string }[] };
    expect(snapshot.comments[0]).toMatchObject({
      authorName: 'Ana',
      text: 'Hola',
    });

    // Volver a agregar el mismo nombre reactiva a la misma persona con PIN nuevo
    const again = await addOk(token, {
      name: 'Ana',
      municipality: 'El Santuario',
      isAdmin: false,
    });
    expect(again.reviewer.id).toBe(ana.reviewer.id);
    expect(again.reviewer.municipality).toBe('El Santuario');
    expect((await login(ana.pin)).status).toBe(401);
    expect((await login(again.pin)).status).toBe(200);
  });

  it('responde 404 si la persona no existe o ya fue eliminada', async () => {
    const root = await createReviewer('Raíz', {
      isAdmin: true,
      municipality: 'Rionegro',
    });
    const token = await tokenFor(root);
    expect((await remove(token, 'no-existe')).status).toBe(404);
  });
});
