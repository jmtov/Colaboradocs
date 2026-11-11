import type { ReviewComment, ReviewSnapshot } from '@colaboradocs/review-core';
import { describe, expect, it } from 'vitest';
import {
  authed,
  createReviewer,
  DOCUMENT,
  postComment,
  tokenFor,
} from './helpers';

async function snapshot(token: string, document = DOCUMENT) {
  const response = await authed(token, `/documents/${document}/review`);
  return (await response.json()) as ReviewSnapshot;
}

describe('comentarios', () => {
  it('crea un comentario y una respuesta, con autor', async () => {
    const ana = await createReviewer('Ana');
    const luis = await createReviewer('Luis');
    const anaToken = await tokenFor(ana);
    const luisToken = await tokenFor(luis);

    const rootResponse = await postComment(anaToken, {
      blockId: 'quienes-abc',
      text: '  ¿Se puede precisar esto?  ',
    });
    expect(rootResponse.status).toBe(201);
    const root = (await rootResponse.json()) as ReviewComment;
    expect(root).toMatchObject({
      authorName: 'Ana',
      text: '¿Se puede precisar esto?',
      parentId: null,
      resolved: false,
    });

    const replyResponse = await postComment(luisToken, {
      blockId: 'quienes-abc',
      text: 'Sí, lo ajusto',
      parentId: root.id,
    });
    expect(replyResponse.status).toBe(201);

    const { comments } = await snapshot(anaToken);
    const mine = comments.filter((c) => c.blockId === 'quienes-abc');
    expect(mine.map((c) => c.authorName)).toEqual(['Ana', 'Luis']);
    expect(mine[1]?.parentId).toBe(root.id);
  });

  it('rechaza texto vacío, demasiado largo, bloque inválido y padre de otro bloque', async () => {
    const ana = await createReviewer('Ana3');
    const token = await tokenFor(ana);
    const ok = (await (
      await postComment(token, { blockId: 'b-uno', text: 'hola' })
    ).json()) as ReviewComment;

    for (const body of [
      { blockId: 'b-uno', text: '   ' },
      { blockId: 'b-uno', text: 'x'.repeat(2001) },
      { blockId: 'MAL ID!', text: 'hola' },
      { blockId: 'b-dos', text: 'hola', parentId: ok.id },
      { blockId: 'b-uno', text: 'hola', parentId: 'no-existe' },
    ]) {
      expect((await postComment(token, body)).status).toBe(400);
    }
  });

  it('aísla los documentos entre sí', async () => {
    const ana = await createReviewer('Ana4');
    const token = await tokenFor(ana);
    await postComment(token, { blockId: 'b-solo', text: 'en principios' });
    const other = await snapshot(token, 'otro-documento');
    expect(other.comments).toEqual([]);
  });

  it('solo el autor o un admin borran; el hilo conserva su forma', async () => {
    const autora = await createReviewer('Autora');
    const intrusa = await createReviewer('Intrusa');
    const admin = await createReviewer('Admin', { isAdmin: true });
    const [autoraToken, intrusaToken, adminToken] = await Promise.all([
      tokenFor(autora),
      tokenFor(intrusa),
      tokenFor(admin),
    ]);
    const first = (await (
      await postComment(autoraToken, { blockId: 'b-del', text: 'uno' })
    ).json()) as ReviewComment;
    const second = (await (
      await postComment(autoraToken, { blockId: 'b-del', text: 'dos' })
    ).json()) as ReviewComment;

    const path = (id: string) => `/documents/${DOCUMENT}/comments/${id}`;
    expect(
      (await authed(intrusaToken, path(first.id), { method: 'DELETE' })).status,
    ).toBe(403);
    expect(
      (await authed(autoraToken, path(first.id), { method: 'DELETE' })).status,
    ).toBe(204);
    expect(
      (await authed(adminToken, path(second.id), { method: 'DELETE' })).status,
    ).toBe(204);

    const { comments } = await snapshot(autoraToken);
    const deleted = comments.filter((c) => c.blockId === 'b-del');
    expect(deleted).toHaveLength(2);
    expect(deleted.every((c) => c.text === null)).toBe(true);
  });

  it('resuelve y reabre un hilo; solo la raíz y solo autor o admin', async () => {
    const autora = await createReviewer('Autora2');
    const otro = await createReviewer('Otro2');
    const autoraToken = await tokenFor(autora);
    const otroToken = await tokenFor(otro);
    const root = (await (
      await postComment(autoraToken, { blockId: 'b-res', text: 'raíz' })
    ).json()) as ReviewComment;
    const reply = (await (
      await postComment(otroToken, {
        blockId: 'b-res',
        text: 'resp',
        parentId: root.id,
      })
    ).json()) as ReviewComment;

    const resolve = (token: string, id: string, resolved: boolean) =>
      authed(token, `/documents/${DOCUMENT}/comments/${id}/resolved`, {
        method: 'PUT',
        body: JSON.stringify({ resolved }),
      });
    expect((await resolve(otroToken, root.id, true)).status).toBe(403);
    expect((await resolve(autoraToken, reply.id, true)).status).toBe(400);
    expect((await resolve(autoraToken, root.id, true)).status).toBe(204);
    let comments = (await snapshot(autoraToken)).comments;
    expect(comments.find((c) => c.id === root.id)?.resolved).toBe(true);
    expect((await resolve(autoraToken, root.id, false)).status).toBe(204);
    comments = (await snapshot(autoraToken)).comments;
    expect(comments.find((c) => c.id === root.id)?.resolved).toBe(false);
  });
});

describe('municipio del revisor', () => {
  it('sale en los comentarios, en el snapshot y al entrar', async () => {
    const eva = await createReviewer('EvaMun', { municipality: 'Cocorná' });
    const sin = await createReviewer('SinMun');
    const login = await (await import('./helpers')).login(eva.pin);
    const body = (await login.json()) as {
      reviewer: { municipality: string | null };
    };
    expect(body.reviewer.municipality).toBe('Cocorná');

    const evaToken = await tokenFor(eva);
    const sinToken = await tokenFor(sin);
    const created = (await (
      await postComment(evaToken, { blockId: 'b-mun', text: 'hola' })
    ).json()) as ReviewComment;
    expect(created.authorMunicipality).toBe('Cocorná');

    const { reviewers, me } = await snapshot(sinToken);
    expect(me.municipality).toBeNull();
    expect(reviewers[eva.id]).toEqual({
      name: 'EvaMun',
      municipality: 'Cocorná',
    });
  });
});

describe('OK por bloque', () => {
  it('marca y quita el OK propio, sin duplicar y sin tocar el de otros', async () => {
    const ana = await createReviewer('AnaOk', { municipality: 'La Ceja' });
    const luis = await createReviewer('LuisOk');
    const anaToken = await tokenFor(ana);
    const luisToken = await tokenFor(luis);
    const path = `/documents/${DOCUMENT}/approvals/b-ok`;

    expect((await authed(anaToken, path, { method: 'PUT' })).status).toBe(204);
    expect((await authed(anaToken, path, { method: 'PUT' })).status).toBe(204);
    expect((await authed(luisToken, path, { method: 'PUT' })).status).toBe(204);

    let { approvals, reviewers } = await snapshot(anaToken);
    const forBlock = approvals.filter((a) => a.blockId === 'b-ok');
    expect(forBlock.map((a) => a.reviewerId).sort()).toEqual(
      [ana.id, luis.id].sort(),
    );
    expect(reviewers[ana.id]).toEqual({
      name: 'AnaOk',
      municipality: 'La Ceja',
    });
    // Cada OK trae cuándo se dio (ISO): la hoja de OK lo muestra.
    for (const approval of forBlock) {
      expect(new Date(approval.createdAt).toISOString()).toBe(
        approval.createdAt,
      );
    }

    expect((await authed(anaToken, path, { method: 'DELETE' })).status).toBe(
      204,
    );
    ({ approvals } = await snapshot(luisToken));
    expect(
      approvals.filter((a) => a.blockId === 'b-ok').map((a) => a.reviewerId),
    ).toEqual([luis.id]);
  });

  it('rechaza un id de bloque inválido', async () => {
    const ana = await createReviewer('AnaOk2');
    const token = await tokenFor(ana);
    const response = await authed(
      token,
      `/documents/${DOCUMENT}/approvals/MAL%20ID`,
      {
        method: 'PUT',
      },
    );
    expect(response.status).toBe(400);
  });
});
