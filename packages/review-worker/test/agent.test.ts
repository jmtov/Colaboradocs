import type { DocumentContent, Task } from '@colaboradocs/review-core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  authed,
  createReviewer,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

function sample(id = 'mi-doc'): DocumentContent {
  return {
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
  };
}

let admin: TestReviewer;
let agent: TestReviewer;
let ana: TestReviewer;
let adminToken: string;
let agentToken: string;
let anaToken: string;

const saveDraft = (token: string, id = 'mi-doc') =>
  authed(token, `/admin/documents/${id}/draft`, {
    method: 'PUT',
    body: JSON.stringify({ content: sample(id), expectedRevision: 0 }),
  });

beforeEach(async () => {
  await resetDatabase();
  admin = await createReviewer('Admin', { isAdmin: true });
  agent = await createReviewer('Claude', { isAgent: true });
  ana = await createReviewer('Ana');
  adminToken = await tokenFor(admin);
  agentToken = await tokenFor(agent);
  anaToken = await tokenFor(ana);
});

describe('agente: borradores', () => {
  it('guarda y lee el borrador de un documento', async () => {
    expect((await saveDraft(agentToken)).status).toBe(200);
    expect(
      (await authed(agentToken, '/admin/documents/mi-doc/draft')).status,
    ).toBe(200);
  });

  it('llega al borrador de una presentación (404 si no existe, no 403)', async () => {
    expect((await authed(agentToken, '/admin/decks/nada/draft')).status).toBe(
      404,
    );
  });

  it('una persona normal no guarda borradores', async () => {
    expect((await saveDraft(anaToken)).status).toBe(403);
  });
});

describe('agente: lo que no puede', () => {
  beforeEach(async () => {
    await saveDraft(adminToken);
  });

  it('no publica el borrador que dejó un admin', async () => {
    const response = await authed(
      agentToken,
      '/admin/documents/mi-doc/publish',
      {
        method: 'POST',
        body: JSON.stringify({ expectedRevision: 1 }),
      },
    );
    expect(response.status).toBe(403);
  });

  it('no descarta el borrador de otro', async () => {
    const response = await authed(agentToken, '/admin/documents/mi-doc/draft', {
      method: 'DELETE',
    });
    expect(response.status).toBe(403);
    expect(
      (await authed(adminToken, '/admin/documents/mi-doc/draft')).status,
    ).toBe(200);
  });

  it('no sube ni archiva documentos publicados', async () => {
    expect(
      (
        await authed(agentToken, '/admin/documents/mi-doc', {
          method: 'PUT',
          body: JSON.stringify(sample()),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await authed(agentToken, '/admin/documents/mi-doc', {
          method: 'DELETE',
        })
      ).status,
    ).toBe(403);
  });

  it('no gestiona accesos ni el espacio', async () => {
    expect((await authed(agentToken, '/admin/reviewers')).status).toBe(403);
    expect(
      (
        await authed(agentToken, '/admin/space', {
          method: 'PUT',
          body: JSON.stringify({ name: 'X' }),
        })
      ).status,
    ).toBe(403);
  });

  it('un admin no puede ascenderlo a admin', async () => {
    const response = await authed(adminToken, `/admin/reviewers/${agent.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin: true }),
    });
    expect(response.status).toBe(403);
    expect((await authed(agentToken, '/admin/reviewers')).status).toBe(403);
  });
});

describe('agente: tareas', () => {
  const create = (token: string, assigneeId: string) =>
    authed(token, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Revisar',
        dueDate: '2026-12-01',
        assigneeId,
      }),
    });

  it('asigna tareas a otra persona y ve las de todos', async () => {
    expect((await create(agentToken, ana.id)).status).toBe(201);
    const response = await authed(agentToken, '/tasks?scope=all');
    expect(response.status).toBe(200);
    expect(((await response.json()) as Task[]).length).toBe(1);
  });

  it('una persona normal sigue sin poder', async () => {
    expect((await create(anaToken, admin.id)).status).toBe(403);
    expect((await authed(anaToken, '/tasks?scope=all')).status).toBe(403);
  });
});

describe('agente: publicar', () => {
  const publish = (token: string, id: string, body: object) =>
    authed(token, `/admin/documents/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  const put = (token: string, document: DocumentContent) =>
    authed(token, `/admin/documents/${document.id}`, {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  const withHtml = (id: string, html: string): DocumentContent => {
    const document = sample(id);
    const [first] = document.sections;
    if (first) first.html = html;
    return document;
  };
  const draftAs = (
    token: string,
    document: DocumentContent,
    revision: number,
  ) =>
    authed(token, `/admin/documents/${document.id}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ content: document, expectedRevision: revision }),
    });

  it('publica un documento nuevo desde su propio borrador', async () => {
    await saveDraft(agentToken, 'nuevo');
    expect(
      (await publish(agentToken, 'nuevo', { expectedRevision: 1 })).status,
    ).toBe(201);
    expect((await authed(anaToken, '/documents/nuevo/content')).status).toBe(
      200,
    );
  });

  it('también reemplaza uno ya publicado, y la versión anterior queda', async () => {
    await put(adminToken, sample('guia'));
    await draftAs(agentToken, withHtml('guia', '<p>Nueva</p>'), 0);
    expect(
      (await publish(agentToken, 'guia', { expectedRevision: 1 })).status,
    ).toBe(200);
    const versions = (await (
      await authed(adminToken, '/documents/guia/versions')
    ).json()) as unknown[];
    expect(versions.length).toBe(2);
  });

  it('no publica si un admin tocó el borrador después', async () => {
    await saveDraft(agentToken, 'nuevo');
    await draftAs(adminToken, withHtml('nuevo', '<p>Retoque</p>'), 1);
    expect(
      (await publish(agentToken, 'nuevo', { expectedRevision: 2 })).status,
    ).toBe(403);
    expect(
      (await publish(adminToken, 'nuevo', { expectedRevision: 2 })).status,
    ).toBe(201);
  });

  it('no puede forzar: si el documento cambió, decide un admin', async () => {
    await put(adminToken, sample('guia'));
    await draftAs(agentToken, withHtml('guia', '<p>Mía</p>'), 0);
    await put(adminToken, withHtml('guia', '<p>Del admin</p>'));
    expect(
      (await publish(agentToken, 'guia', { expectedRevision: 1 })).status,
    ).toBe(409);
    expect(
      (await publish(agentToken, 'guia', { expectedRevision: 1, force: true }))
        .status,
    ).toBe(403);
  });

  it('no publica presentaciones', async () => {
    const response = await authed(agentToken, '/admin/decks/charla/publish', {
      method: 'POST',
      body: JSON.stringify({ expectedRevision: 1 }),
    });
    expect(response.status).toBe(403);
  });
});

describe('tareas: asociar un documento después', () => {
  const create = async (token: string, body: object = {}) =>
    (await (
      await authed(token, '/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Revisar',
          dueDate: '2026-12-01',
          ...body,
        }),
      })
    ).json()) as Task;
  const patch = (token: string, id: string, body: object) =>
    authed(token, `/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  beforeEach(async () => {
    await authed(adminToken, '/admin/documents/guia', {
      method: 'PUT',
      body: JSON.stringify(sample('guia')),
    });
  });

  it('se crea sin documento y se asocia luego; un bloque necesita documento', async () => {
    const task = await create(agentToken, { assigneeId: ana.id });
    expect(task.documentId).toBeNull();

    expect(
      (await patch(agentToken, task.id, { blockId: 'a-1234' })).status,
    ).toBe(400);
    const linked = await patch(agentToken, task.id, {
      documentId: 'guia',
      blockId: 'a-1234',
    });
    expect(linked.status).toBe(200);
    expect(((await linked.json()) as Task).blockId).toBe('a-1234');
  });

  it('cambiar de documento suelta el bloque; null suelta el documento', async () => {
    await authed(adminToken, '/admin/documents/otro', {
      method: 'PUT',
      body: JSON.stringify(sample('otro')),
    });
    const task = await create(agentToken, {
      documentId: 'guia',
      blockId: 'a-1234',
    });
    const moved = (await (
      await patch(agentToken, task.id, { documentId: 'otro' })
    ).json()) as Task;
    expect([moved.documentId, moved.blockId]).toEqual(['otro', null]);
    const freed = (await (
      await patch(agentToken, task.id, { documentId: null })
    ).json()) as Task;
    expect(freed.documentId).toBeNull();
  });

  it('un documento que no existe se rechaza', async () => {
    const task = await create(agentToken);
    expect(
      (await patch(agentToken, task.id, { documentId: 'nada' })).status,
    ).toBe(400);
  });

  it('solo la crea quien la creó o un admin; quien la tiene no puede', async () => {
    const task = await create(agentToken, { assigneeId: ana.id });
    expect(
      (await patch(anaToken, task.id, { documentId: 'guia' })).status,
    ).toBe(403);
    expect(
      (await patch(adminToken, task.id, { documentId: 'guia' })).status,
    ).toBe(200);
  });
});
