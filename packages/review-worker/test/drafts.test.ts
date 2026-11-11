import { env } from 'cloudflare:test';
import type {
  DocumentContent,
  DocumentDraft,
  DocumentVersionItem,
  DraftInfo,
} from '@colaboradocs/review-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDraftAtRevision } from '../src/db/drafts.queries';
import {
  authed,
  createReviewer,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

function sample(id = 'mi-doc', html = '<p>Hola</p>'): DocumentContent {
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
        html,
      },
    ],
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

const publishedPut = (token: string, document: DocumentContent) =>
  authed(token, `/admin/documents/${document.id}`, {
    method: 'PUT',
    body: JSON.stringify(document),
  });

const saveDraft = (
  token: string,
  content: DocumentContent | object,
  expectedRevision: number,
  id = (content as { id: string }).id,
) =>
  authed(token, `/admin/documents/${id}/draft`, {
    method: 'PUT',
    body: JSON.stringify({ content, expectedRevision }),
  });

const getDraft = (token: string, id: string) =>
  authed(token, `/admin/documents/${id}/draft`);

const publish = (token: string, id: string, body: object) =>
  authed(token, `/admin/documents/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

const published = async (token: string, id: string) =>
  (await (
    await authed(token, `/documents/${id}/content`)
  ).json()) as DocumentContent;

let admin: TestReviewer;
let other: TestReviewer;
let member: TestReviewer;
let adminToken: string;
let otherToken: string;
let memberToken: string;

beforeEach(async () => {
  await resetDatabase();
  admin = await createReviewer('Admin', {
    isAdmin: true,
    municipality: 'Rionegro',
  });
  other = await createReviewer('Otra', { isAdmin: true });
  member = await createReviewer('Miembro');
  adminToken = await tokenFor(admin);
  otherToken = await tokenFor(other);
  memberToken = await tokenFor(member);
});

describe('borrador', () => {
  it('solo los admins lo leen, lo guardan, lo descartan o lo publican', async () => {
    await saveDraft(adminToken, sample(), 0);
    expect((await getDraft(memberToken, 'mi-doc')).status).toBe(403);
    expect((await saveDraft(memberToken, sample(), 1)).status).toBe(403);
    expect(
      (
        await authed(memberToken, '/admin/documents/mi-doc/draft', {
          method: 'DELETE',
        })
      ).status,
    ).toBe(403);
    expect(
      (await publish(memberToken, 'mi-doc', { expectedRevision: 1 })).status,
    ).toBe(403);
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(200);
  });

  it('sin sesión no hay acceso', async () => {
    const response = await authed('x', '/admin/documents/mi-doc/draft');
    expect(response.status).toBe(401);
  });

  it('sin borrador, 404', async () => {
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(404);
  });

  it('un documento nuevo: el borrador se guarda y se lee, y los revisores no lo ven', async () => {
    const saved = await saveDraft(adminToken, sample(), 0);
    expect(saved.status).toBe(200);
    const info = (await saved.json()) as DraftInfo;
    expect(info.revision).toBe(1);
    expect(info.updatedBy).toEqual({ name: 'Admin', municipality: 'Rionegro' });
    expect(info.baseUpdatedAt).toBeNull();
    expect(info.stale).toBe(false);

    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.content.sections[0]?.html).toBe('<p>Hola</p>');
    expect(draft.revision).toBe(1);

    expect(
      (await authed(memberToken, '/documents/mi-doc/content')).status,
    ).toBe(404);
    const list = (await (await authed(memberToken, '/documents')).json()) as {
      id: string;
    }[];
    expect(list).toEqual([]);
  });

  it('cada guardado sube la revisión y guarda quién fue', async () => {
    await saveDraft(adminToken, sample(), 0);
    const second = (await (
      await saveDraft(otherToken, sample('mi-doc', '<p>Dos</p>'), 1)
    ).json()) as DraftInfo;
    expect(second.revision).toBe(2);
    expect(second.updatedBy?.name).toBe('Otra');
    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.content.sections[0]?.html).toBe('<p>Dos</p>');
  });

  it('un guardado con una revisión vieja se rechaza y no pisa al otro', async () => {
    await saveDraft(adminToken, sample(), 0);
    await saveDraft(otherToken, sample('mi-doc', '<p>De la otra</p>'), 1);

    const late = await saveDraft(adminToken, sample('mi-doc', '<p>Mío</p>'), 1);
    expect(late.status).toBe(409);
    expect(((await late.json()) as { error: string }).error).toBe('conflict');
    // creer que no hay borrador cuando sí lo hay, también
    expect((await saveDraft(adminToken, sample(), 0)).status).toBe(409);

    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.content.sections[0]?.html).toBe('<p>De la otra</p>');
    expect(draft.revision).toBe(2);
  });

  it('con el documento ya publicado, el borrador no lo toca hasta publicar', async () => {
    await publishedPut(adminToken, sample('mi-doc', '<p>Publicado</p>'));
    const info = (await (
      await saveDraft(adminToken, sample('mi-doc', '<p>Cambio</p>'), 0)
    ).json()) as DraftInfo;
    expect(info.baseUpdatedAt).not.toBeNull();
    expect(info.stale).toBe(false);
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Publicado</p>',
    );
  });

  it('valida y limpia como al subir un documento', async () => {
    const dirty = sample(
      'mi-doc',
      '<p onclick="x()">Hola</p><script>1</script>',
    );
    await saveDraft(adminToken, dirty, 0);
    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.content.sections[0]?.html).toBe('<p>Hola</p>');

    const bad = await saveDraft(adminToken, { ...sample(), sections: [] }, 1);
    expect(bad.status).toBe(400);
    const body = (await bad.json()) as { error: string; details: string[] };
    expect(body.error).toBe('invalid_request');
    expect(body.details.join(' ')).toContain('sections');
  });

  it('rechaza un id que no coincide, una revisión inválida y un cuerpo que no es JSON', async () => {
    const mismatch = await saveDraft(adminToken, sample('otro'), 0, 'mi-doc');
    expect(mismatch.status).toBe(400);
    for (const expectedRevision of [-1, 1.5, '1', null]) {
      const response = await authed(
        adminToken,
        '/admin/documents/mi-doc/draft',
        {
          method: 'PUT',
          body: JSON.stringify({ content: sample(), expectedRevision }),
        },
      );
      expect(response.status).toBe(400);
    }
    const notJson = await authed(adminToken, '/admin/documents/mi-doc/draft', {
      method: 'PUT',
      body: 'no es json',
    });
    expect(notJson.status).toBe(400);
  });

  it('descartar borra el borrador y deja lo publicado', async () => {
    await publishedPut(adminToken, sample('mi-doc', '<p>Publicado</p>'));
    await saveDraft(adminToken, sample('mi-doc', '<p>Cambio</p>'), 0);
    const discard = () =>
      authed(adminToken, '/admin/documents/mi-doc/draft', { method: 'DELETE' });
    expect((await discard()).status).toBe(204);
    expect((await discard()).status).toBe(404);
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(404);
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Publicado</p>',
    );
  });
});

describe('publicar', () => {
  it('un documento nuevo: queda publicado y el borrador desaparece', async () => {
    await saveDraft(adminToken, sample(), 0);
    const response = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ created: true });
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Hola</p>',
    );
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(404);
  });

  it('un documento existente: lo reemplaza y guarda la versión anterior', async () => {
    await publishedPut(adminToken, sample('mi-doc', '<p>Antes</p>'));
    await saveDraft(adminToken, sample('mi-doc', '<p>Después</p>'), 0);
    const response = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ created: false });
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Después</p>',
    );
    const versions = (await (
      await authed(memberToken, '/documents/mi-doc/versions')
    ).json()) as DocumentVersionItem[];
    expect(versions).toHaveLength(2);
  });

  it('sin borrador, 404', async () => {
    const response = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(response.status).toBe(404);
  });

  it('con una revisión vieja se rechaza y no publica nada', async () => {
    await saveDraft(adminToken, sample(), 0);
    await saveDraft(otherToken, sample('mi-doc', '<p>Más nuevo</p>'), 1);
    const response = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(response.status).toBe(409);
    expect(((await response.json()) as { error: string }).error).toBe(
      'conflict',
    );
    expect(
      (await authed(memberToken, '/documents/mi-doc/content')).status,
    ).toBe(404);
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(200);
  });

  it('exige una revisión entera desde 1', async () => {
    await saveDraft(adminToken, sample(), 0);
    for (const expectedRevision of [0, -1, 'x', undefined]) {
      const response = await publish(adminToken, 'mi-doc', {
        expectedRevision,
      });
      expect(response.status).toBe(400);
    }
  });

  it('si el publicado cambió después del borrador, avisa y solo publica con force', async () => {
    await publishedPut(adminToken, sample('mi-doc', '<p>Base</p>'));
    await tick();
    await saveDraft(adminToken, sample('mi-doc', '<p>Mi cambio</p>'), 0);
    await tick();
    // alguien sube un reemplazo por el camino de siempre
    await publishedPut(otherToken, sample('mi-doc', '<p>Reemplazo ajeno</p>'));

    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.stale).toBe(true);

    const refused = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(refused.status).toBe(409);
    expect(((await refused.json()) as { error: string }).error).toBe(
      'draft_stale',
    );
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Reemplazo ajeno</p>',
    );

    const forced = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
      force: true,
    });
    expect(forced.status).toBe(200);
    expect((await published(memberToken, 'mi-doc')).sections[0]?.html).toBe(
      '<p>Mi cambio</p>',
    );
  });

  it('un documento nuevo que alguien creó con ese id mientras tanto también queda viejo', async () => {
    await saveDraft(adminToken, sample('mi-doc', '<p>Mío</p>'), 0);
    await tick();
    await publishedPut(otherToken, sample('mi-doc', '<p>Suyo</p>'));
    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.stale).toBe(true);
    const refused = await publish(adminToken, 'mi-doc', {
      expectedRevision: 1,
    });
    expect(refused.status).toBe(409);
  });

  it('al publicar solo se borra el borrador de la revisión publicada', async () => {
    await saveDraft(adminToken, sample(), 0);
    await saveDraft(otherToken, sample('mi-doc', '<p>Tras</p>'), 1);
    // Un guardado (revisión 2) llegó mientras se publicaba la revisión 1: no se pierde.
    await deleteDraftAtRevision(env.DB, 'mi-doc', 1);
    const draft = (await (
      await getDraft(adminToken, 'mi-doc')
    ).json()) as DocumentDraft;
    expect(draft.revision).toBe(2);
    await deleteDraftAtRevision(env.DB, 'mi-doc', 2);
    expect((await getDraft(adminToken, 'mi-doc')).status).toBe(404);
  });
});
