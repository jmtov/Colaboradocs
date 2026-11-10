import { env } from 'cloudflare:test';
import type {
  DocumentContent,
  DocumentListItem,
  SpaceInfo,
} from '@juntanza/review-core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  authed,
  createReviewer,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

function sample(
  id = 'mi-doc',
  extra: Partial<DocumentContent> = {},
): DocumentContent {
  return {
    id,
    title: `Documento ${id}`,
    version: '0.1',
    updated: '2026-11-10',
    sources: [],
    sections: [
      {
        id: 'intro',
        num: '1',
        title: 'Introducción',
        status: 'borrador',
        html: '<p>Hola</p>',
      },
    ],
    ...extra,
  };
}

const put = (
  token: string,
  document: object,
  id = (document as { id: string }).id,
) =>
  authed(token, `/admin/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(document),
  });

let admin: TestReviewer;
let member: TestReviewer;
let adminToken: string;
let memberToken: string;

beforeEach(async () => {
  await resetDatabase();
  admin = await createReviewer('Admin', {
    isAdmin: true,
    municipality: 'Rionegro',
  });
  member = await createReviewer('Miembro', { municipality: 'La Ceja' });
  adminToken = await tokenFor(admin);
  memberToken = await tokenFor(member);
});

async function list(token: string) {
  const response = await authed(token, '/documents');
  expect(response.status).toBe(200);
  return (await response.json()) as DocumentListItem[];
}

describe('subir y leer documentos', () => {
  it('un admin crea un documento; todos con sesión lo ven y lo leen', async () => {
    const created = await put(
      adminToken,
      sample('uno', { description: 'Para probar' }),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ created: true });

    const items = await list(memberToken);
    expect(items).toEqual([
      {
        id: 'uno',
        title: 'Documento uno',
        description: 'Para probar',
        version: '0.1',
        updated: '2026-11-10',
        openThreads: 0,
        comments: 0,
        approvals: 0,
        lastActivityAt: null,
      },
    ]);
    const content = await authed(memberToken, '/documents/uno/content');
    expect(content.status).toBe(200);
    expect(((await content.json()) as DocumentContent).sections[0]?.html).toBe(
      '<p>Hola</p>',
    );
  });

  it('el contenido y la lista exigen sesión', async () => {
    await put(adminToken, sample('uno'));
    expect((await api('/documents')).status).toBe(401);
    expect((await api('/documents/uno/content')).status).toBe(401);
  });

  it('solo los admins suben o archivan', async () => {
    expect((await put(memberToken, sample('uno'))).status).toBe(403);
    expect(
      (await authed(memberToken, '/admin/documents/uno', { method: 'DELETE' }))
        .status,
    ).toBe(403);
    expect(await list(memberToken)).toEqual([]);
  });

  it('un documento que no existe da 404', async () => {
    expect((await authed(memberToken, '/documents/nada/content')).status).toBe(
      404,
    );
  });

  it('limpia el HTML antes de guardarlo', async () => {
    const dirty = sample('uno');
    (dirty.sections[0] as { html: string }).html =
      '<p onclick="x()">Hola</p><script>alert(1)</script>';
    await put(adminToken, dirty);
    const stored = (await (
      await authed(memberToken, '/documents/uno/content')
    ).json()) as DocumentContent;
    expect(stored.sections[0]?.html).toBe('<p>Hola</p>');
  });

  it('rechaza lo inválido explicando por qué, y no guarda nada', async () => {
    const bad = await put(adminToken, { ...sample('uno'), sections: [] });
    expect(bad.status).toBe(400);
    const body = (await bad.json()) as { error: string; details: string[] };
    expect(body.error).toBe('invalid_request');
    expect(body.details.join(' ')).toContain('sections');
    expect(await list(adminToken)).toEqual([]);
  });

  it('el id de la ruta tiene que coincidir con el del documento', async () => {
    const response = await put(adminToken, sample('uno'), 'otro');
    expect(response.status).toBe(400);
    expect(
      ((await response.json()) as { details: string[] }).details.join(' '),
    ).toContain('no coincide');
  });
});

describe('reemplazar y archivar', () => {
  it('reemplazar actualiza el documento y guarda la versión anterior', async () => {
    await put(adminToken, sample('uno'));
    const second = sample('uno', { version: '0.2', title: 'Nuevo título' });
    (second.sections[0] as { html: string }).html = '<p>Cambiado</p>';
    const response = await put(adminToken, second);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ created: false });

    const [item] = await list(memberToken);
    expect(item).toMatchObject({ title: 'Nuevo título', version: '0.2' });
    const versions = await env.DB.prepare(
      'SELECT content, saved_by FROM document_versions WHERE document_id = ?',
    )
      .bind('uno')
      .all<{ content: string; saved_by: string }>();
    expect(versions.results).toHaveLength(1);
    expect(
      JSON.parse(versions.results[0]?.content ?? '{}').sections[0].html,
    ).toBe('<p>Hola</p>');
    expect(versions.results[0]?.saved_by).toBe(admin.id);
  });

  it('archivar oculta el documento, conserva los comentarios y volver a subirlo lo reactiva', async () => {
    await put(adminToken, sample('uno'));
    await authed(memberToken, '/documents/uno/comments', {
      method: 'POST',
      body: JSON.stringify({
        blockId: 'intro-1',
        parentId: null,
        text: 'Un comentario',
        blockExcerpt: 'x',
      }),
    });
    expect(
      (await authed(adminToken, '/admin/documents/uno', { method: 'DELETE' }))
        .status,
    ).toBe(204);
    expect(await list(memberToken)).toEqual([]);
    expect((await authed(memberToken, '/documents/uno/content')).status).toBe(
      404,
    );
    // archivar dos veces: ya no está visible
    expect(
      (await authed(adminToken, '/admin/documents/uno', { method: 'DELETE' }))
        .status,
    ).toBe(404);

    await put(adminToken, sample('uno'));
    const [item] = await list(memberToken);
    expect(item).toMatchObject({ id: 'uno', comments: 1, openThreads: 1 });
  });
});

describe('actividad en la lista', () => {
  it('cuenta hilos abiertos, comentarios, OK y la última actividad por documento', async () => {
    await put(adminToken, sample('a'));
    await put(adminToken, sample('b'));
    const comment = (document: string, body: object) =>
      authed(memberToken, `/documents/${document}/comments`, {
        method: 'POST',
        body: JSON.stringify({ blockExcerpt: 'x', parentId: null, ...body }),
      });
    const root = (await (
      await comment('a', { blockId: 'a-1', text: 'Uno' })
    ).json()) as { id: string };
    await comment('a', {
      blockId: 'a-1',
      text: 'Respuesta',
      parentId: root.id,
    });
    const second = (await (
      await comment('a', { blockId: 'a-2', text: 'Dos' })
    ).json()) as { id: string };
    await authed(memberToken, `/documents/a/approvals/a-1`, { method: 'PUT' });
    await authed(memberToken, `/documents/b/approvals/b-1`, { method: 'PUT' });
    await authed(memberToken, `/documents/a/comments/${second.id}/resolved`, {
      method: 'PUT',
      body: JSON.stringify({ resolved: true }),
    });

    const byId = Object.fromEntries(
      (await list(memberToken)).map((item) => [item.id, item]),
    );
    expect(byId.a).toMatchObject({ comments: 3, openThreads: 1, approvals: 1 });
    expect(byId.a?.lastActivityAt).toBeTruthy();
    expect(byId.b).toMatchObject({ comments: 0, openThreads: 0, approvals: 1 });
  });
});

describe('espacio', () => {
  it('es público, con un nombre por defecto', async () => {
    const response = await api('/space');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'Documentos' });
  });

  it('un admin lo cambia; los demás no', async () => {
    const space: SpaceInfo = {
      name: 'Juntanza',
      description: 'Documentos en revisión',
      roleField: { label: 'Municipio', format: 'Representante {value}' },
    };
    const put = (token: string, body: object) =>
      authed(token, '/admin/space', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    expect((await put(memberToken, space)).status).toBe(403);
    expect((await put(adminToken, space)).status).toBe(200);
    expect(await (await api('/space')).json()).toEqual(space);
    expect((await put(adminToken, { name: '' })).status).toBe(400);
    expect(
      (
        await put(adminToken, {
          name: 'X',
          roleField: { label: 'A', format: 'sin valor' },
        })
      ).status,
    ).toBe(400);
  });
});
