import type { Deck, DeckBundle, DeckListItem } from '@colaboradocs/deck-core';
import { neutralTheme } from '@colaboradocs/themes';
import { beforeEach, describe, expect, it } from 'vitest';
import { authed, createReviewer, resetDatabase, tokenFor } from './helpers';

const deck = (id = 'charla', extra: Partial<Deck> = {}): Deck => ({
  version: 1,
  id,
  title: `Deck ${id}`,
  lang: 'es',
  theme: 'neutral',
  slides: [{ kind: 'content', body: [] }],
  ...extra,
});

const WOFF2 = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3]);

let admin: string;
let member: string;

const putJson = (token: string, path: string, body: unknown) =>
  authed(token, path, { method: 'PUT', body: JSON.stringify(body) });

const putFile = (
  token: string,
  path: string,
  type: string,
  bytes: Uint8Array<ArrayBuffer>,
) =>
  authed(token, path, {
    method: 'PUT',
    headers: { 'Content-Type': type },
    body: bytes,
  });

beforeEach(async () => {
  await resetDatabase();
  admin = await tokenFor(await createReviewer('Admin', { isAdmin: true }));
  member = await tokenFor(await createReviewer('Persona'));
});

describe('temas', () => {
  it('un admin sube un tema y se lista; uno inválido se rechaza con detalles', async () => {
    expect(
      (await putJson(admin, '/admin/themes/neutral', neutralTheme)).status,
    ).toBe(201);
    expect(
      (await putJson(admin, '/admin/themes/neutral', neutralTheme)).status,
    ).toBe(200);
    const list = (await (await authed(admin, '/admin/themes')).json()) as {
      id: string;
      variants: number;
    }[];
    expect(list).toEqual([
      expect.objectContaining({ id: 'neutral', variants: 1 }),
    ]);

    const bad = await putJson(admin, '/admin/themes/neutral', {
      ...neutralTheme,
      fonts: [],
    });
    expect(bad.status).toBe(400);
    expect(
      ((await bad.json()) as { details: string[] }).details.join(),
    ).toContain('fuente');
  });

  it('quien no es admin no puede subir', async () => {
    expect(
      (await putJson(member, '/admin/themes/neutral', neutralTheme)).status,
    ).toBe(403);
  });

  it('las fuentes se guardan y se sirven con su tipo; solo tipos permitidos', async () => {
    await putJson(admin, '/admin/themes/neutral', neutralTheme);
    expect(
      (
        await putFile(
          admin,
          '/admin/themes/neutral/files/geist-400.woff2',
          'font/woff2',
          WOFF2,
        )
      ).status,
    ).toBe(204);
    const res = await authed(member, '/themes/neutral/files/geist-400.woff2');
    expect(res.headers.get('Content-Type')).toBe('font/woff2');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(WOFF2);
    expect(
      (
        await putFile(
          admin,
          '/admin/themes/neutral/files/x.js',
          'text/javascript',
          WOFF2,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await putFile(
          admin,
          '/admin/themes/nada/files/a.woff2',
          'font/woff2',
          WOFF2,
        )
      ).status,
    ).toBe(404);
    expect(
      (await authed(member, '/themes/neutral/files/otra.woff2')).status,
    ).toBe(404);
  });
});

describe('decks', () => {
  beforeEach(async () => {
    await putJson(admin, '/admin/themes/neutral', neutralTheme);
  });

  it('crea, reemplaza (guarda la versión anterior) y entrega deck + tema a quien tenga PIN', async () => {
    expect((await putJson(admin, '/admin/decks/charla', deck())).status).toBe(
      201,
    );
    expect(
      (
        await putJson(
          admin,
          '/admin/decks/charla',
          deck('charla', { title: 'Nuevo' }),
        )
      ).status,
    ).toBe(200);
    const bundle = (await (
      await authed(member, '/decks/charla')
    ).json()) as DeckBundle;
    expect(bundle.deck.title).toBe('Nuevo');
    expect(bundle.theme.id).toBe('neutral');
    const versions = await (await import('cloudflare:test')).env.DB.prepare(
      'SELECT COUNT(*) AS n FROM deck_versions',
    ).first<{ n: number }>();
    expect(versions?.n).toBe(1);
    const list = (await (
      await authed(member, '/decks')
    ).json()) as DeckListItem[];
    expect(list).toEqual([
      expect.objectContaining({ id: 'charla', title: 'Nuevo', slides: 1 }),
    ]);
  });

  it('sin PIN no se ve nada', async () => {
    const res = await (await import('./helpers')).api('/decks');
    expect(res.status).toBe(401);
  });

  it('rechaza: tema que no existe, id distinto al de la ruta y deck inválido', async () => {
    expect(
      (
        await putJson(
          admin,
          '/admin/decks/charla',
          deck('charla', { theme: 'otro' }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await putJson(admin, '/admin/decks/otra', deck('charla'))).status,
    ).toBe(400);
    const bad = await putJson(
      admin,
      '/admin/decks/charla',
      deck('charla', { slides: [{ kind: 'content', category: 99, body: [] }] }),
    );
    expect(bad.status).toBe(400);
    expect(
      ((await bad.json()) as { details: string[] }).details.length,
    ).toBeGreaterThan(0);
  });

  it('archivar lo oculta de la lista y del visor', async () => {
    await putJson(admin, '/admin/decks/charla', deck());
    expect(
      (await authed(admin, '/admin/decks/charla', { method: 'DELETE' })).status,
    ).toBe(204);
    expect((await authed(member, '/decks/charla')).status).toBe(404);
    expect(await (await authed(member, '/decks')).json()).toEqual([]);
  });

  it('los archivos del deck se guardan por ruta, se listan en el bundle y no admiten rutas raras', async () => {
    await putJson(admin, '/admin/decks/charla', deck());
    expect(
      (
        await putFile(
          admin,
          '/admin/decks/charla/files/qr.svg',
          'image/svg+xml',
          WOFF2,
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await putFile(
          admin,
          '/admin/decks/charla/files/img/foto.png',
          'image/png',
          WOFF2,
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await putFile(
          admin,
          '/admin/decks/charla/files/..%2Fsecreto',
          'image/png',
          WOFF2,
        )
      ).status,
    ).toBe(404);
    const bundle = (await (
      await authed(member, '/decks/charla')
    ).json()) as DeckBundle;
    expect(bundle.files).toEqual(['img/foto.png', 'qr.svg']);
    const res = await authed(member, '/decks/charla/files/img/foto.png');
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect((await authed(member, '/decks/charla/files/falta.png')).status).toBe(
      404,
    );
  });
});
