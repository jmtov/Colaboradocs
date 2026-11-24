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

  it('no publica', async () => {
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
