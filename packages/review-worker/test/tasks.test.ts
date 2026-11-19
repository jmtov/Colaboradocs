import type { Task } from '@colaboradocs/review-core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  authed,
  createReviewer,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

const FUTURE = '2026-12-01';

let admin: TestReviewer;
let ana: TestReviewer;
let luis: TestReviewer;
let adminToken: string;
let anaToken: string;
let luisToken: string;

function createTask(token: string, body: Record<string, unknown>) {
  return authed(token, '/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Escribir a Abejorral',
      dueDate: FUTURE,
      ...body,
    }),
  });
}

async function list(token: string, query = '') {
  const response = await authed(token, `/tasks${query}`);
  return { status: response.status, tasks: (await response.json()) as Task[] };
}

beforeEach(async () => {
  await resetDatabase();
  admin = await createReviewer('Admin', { isAdmin: true });
  ana = await createReviewer('Ana', { municipality: 'La Ceja' });
  luis = await createReviewer('Luis');
  adminToken = await tokenFor(admin);
  anaToken = await tokenFor(ana);
  luisToken = await tokenFor(luis);
});

async function putDocument(id: string) {
  await authed(adminToken, `/admin/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      title: `Documento ${id}`,
      version: '0.1',
      updated: '2026-11-10',
      sources: [],
      sections: [
        {
          id: 'a',
          num: '1',
          title: 'A',
          status: 'borrador',
          html: '<p>Hola</p>',
        },
      ],
    }),
  });
}

describe('crear tareas', () => {
  it('sin asignado, la tarea es de quien la crea, con su nombre y municipio', async () => {
    const response = await createTask(anaToken, {});
    expect(response.status).toBe(201);
    const task = (await response.json()) as Task;
    expect(task).toMatchObject({
      title: 'Escribir a Abejorral',
      dueDate: FUTURE,
      assigneeName: 'Ana',
      assigneeMunicipality: 'La Ceja',
      createdByName: 'Ana',
      doneAt: null,
      documentId: null,
    });
  });

  it('asignar a otra persona es de admins', async () => {
    expect((await createTask(anaToken, { assigneeId: luis.id })).status).toBe(
      403,
    );
    const response = await createTask(adminToken, { assigneeId: luis.id });
    expect(response.status).toBe(201);
    expect(((await response.json()) as Task).assigneeName).toBe('Luis');
    expect((await list(luisToken)).tasks).toHaveLength(1);
  });

  it('no se asigna a quien no existe', async () => {
    const response = await createTask(adminToken, { assigneeId: 'no-existe' });
    expect(response.status).toBe(400);
  });

  it('no se asigna a quien ya no tiene acceso', async () => {
    await authed(adminToken, `/admin/reviewers/${luis.id}`, {
      method: 'DELETE',
    });
    expect((await createTask(adminToken, { assigneeId: luis.id })).status).toBe(
      400,
    );
  });

  it('cuelga de un documento que existe, con su título; uno inexistente se rechaza', async () => {
    await putDocument('acta');
    const ok = await createTask(anaToken, {
      documentId: 'acta',
      blockId: 'b-uno',
    });
    expect(ok.status).toBe(201);
    expect(await ok.json()).toMatchObject({
      documentId: 'acta',
      documentTitle: 'Documento acta',
      blockId: 'b-uno',
    });
    expect((await createTask(anaToken, { documentId: 'nada' })).status).toBe(
      400,
    );
  });

  it('rechaza título vacío, fecha mala y sesión faltante', async () => {
    expect((await createTask(anaToken, { title: ' ' })).status).toBe(400);
    expect((await createTask(anaToken, { dueDate: '2026-02-30' })).status).toBe(
      400,
    );
    const anonymous = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'x', dueDate: FUTURE }),
    });
    expect(anonymous.status).toBe(401);
  });
});

describe('listar tareas', () => {
  it('«mías» trae solo las propias, pendientes primero y por fecha', async () => {
    await createTask(anaToken, { title: 'Tarde', dueDate: '2026-12-20' });
    await createTask(anaToken, { title: 'Pronto', dueDate: '2026-11-21' });
    await createTask(luisToken, { title: 'De Luis' });
    const done = (await (
      await createTask(anaToken, { title: 'Hecha', dueDate: '2026-11-01' })
    ).json()) as Task;
    await authed(anaToken, `/tasks/${done.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: true }),
    });
    const { tasks } = await list(anaToken);
    expect(tasks.map((t) => t.title)).toEqual(['Pronto', 'Tarde', 'Hecha']);
  });

  it('por documento trae las de todas las personas; «todas» es de admins', async () => {
    await putDocument('acta');
    await createTask(anaToken, { documentId: 'acta' });
    await createTask(luisToken, { documentId: 'acta' });
    await createTask(luisToken, {});
    expect((await list(anaToken, '?document=acta')).tasks).toHaveLength(2);
    expect((await list(anaToken, '?scope=all')).status).toBe(403);
    expect((await list(adminToken, '?scope=all')).tasks).toHaveLength(3);
    expect((await list(anaToken, '?document=MAL ID')).status).toBe(400);
    expect((await list(anaToken, '?scope=otro')).status).toBe(400);
  });
});

describe('personas', () => {
  it('lista a quienes tienen acceso, por nombre, sin los revocados', async () => {
    const before = await authed(anaToken, '/tasks/people');
    const people = (await before.json()) as { id: string; name: string }[];
    expect(people.map((p) => p.name)).toEqual(['Admin', 'Ana', 'Luis']);
    await authed(adminToken, `/admin/reviewers/${luis.id}`, {
      method: 'DELETE',
    });
    const after = (await (await authed(anaToken, '/tasks/people')).json()) as {
      name: string;
    }[];
    expect(after.map((p) => p.name)).toEqual(['Admin', 'Ana']);
    expect((await api('/tasks/people')).status).toBe(401);
  });
});

describe('cambiar y borrar tareas', () => {
  async function made(token: string, body: Record<string, unknown> = {}) {
    return (await (await createTask(token, body)).json()) as Task;
  }
  const patch = (token: string, id: string, body: Record<string, unknown>) =>
    authed(token, `/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  it('quien la tiene la marca hecha y la reabre', async () => {
    const task = await made(anaToken);
    const done = (await (
      await patch(anaToken, task.id, { done: true })
    ).json()) as Task;
    expect(done.doneAt).not.toBeNull();
    const reopened = (await (
      await patch(anaToken, task.id, { done: false })
    ).json()) as Task;
    expect(reopened.doneAt).toBeNull();
  });

  it('otra persona no la marca hecha, pero un admin sí', async () => {
    const task = await made(anaToken);
    expect((await patch(luisToken, task.id, { done: true })).status).toBe(403);
    expect((await patch(adminToken, task.id, { done: true })).status).toBe(200);
  });

  it('el título y la fecha son de quien la creó o admins; la persona asignada sola no los cambia', async () => {
    const task = await made(adminToken, { assigneeId: luis.id });
    expect((await patch(luisToken, task.id, { title: 'Otro' })).status).toBe(
      403,
    );
    expect((await patch(luisToken, task.id, { done: true })).status).toBe(200);
    const mine = await made(anaToken);
    const changed = (await (
      await patch(anaToken, mine.id, { title: 'Nuevo', dueDate: '2026-12-15' })
    ).json()) as Task;
    expect(changed).toMatchObject({ title: 'Nuevo', dueDate: '2026-12-15' });
  });

  it('pasar la tarea a otra persona es solo de admins', async () => {
    const task = await made(anaToken);
    expect(
      (await patch(anaToken, task.id, { assigneeId: luis.id })).status,
    ).toBe(403);
    const moved = (await (
      await patch(adminToken, task.id, { assigneeId: luis.id })
    ).json()) as Task;
    expect(moved.assigneeName).toBe('Luis');
  });

  it('cambios vacíos o una tarea inexistente se rechazan', async () => {
    const task = await made(anaToken);
    expect((await patch(anaToken, task.id, {})).status).toBe(400);
    expect((await patch(anaToken, 'nada', { done: true })).status).toBe(404);
  });

  it('borra quien la creó o un admin', async () => {
    const task = await made(anaToken);
    const del = (token: string, id: string) =>
      authed(token, `/tasks/${id}`, { method: 'DELETE' });
    expect((await del(luisToken, task.id)).status).toBe(403);
    expect((await del(anaToken, task.id)).status).toBe(204);
    expect((await list(anaToken)).tasks).toHaveLength(0);
    const other = await made(luisToken);
    expect((await del(adminToken, other.id)).status).toBe(204);
    expect((await del(adminToken, other.id)).status).toBe(404);
  });
});
