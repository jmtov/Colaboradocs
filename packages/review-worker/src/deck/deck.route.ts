import {
  type Deck,
  type DeckBundle,
  type Theme,
  validateDeck,
  validateTheme,
} from '@colaboradocs/deck-core';
import { Hono } from 'hono';
import {
  requireAdmin,
  requireAdminAccess,
  requireReviewer,
} from '@/access/auth.middleware';
import {
  archiveDeck,
  base64ToBytes,
  bytesToBase64,
  discardDeckDraft,
  findDeck,
  findDeckDraft,
  findDeckFile,
  findTheme,
  findThemeFile,
  listDeckFilePaths,
  listDecks,
  listFullThemes,
  listThemes,
  type StoredFile,
  saveDeck,
  saveDeckDraft,
  saveDeckFile,
  saveTheme,
  saveThemeFile,
} from '@/deck/deck.queries';
import type { AppEnv } from '@/shared/env.types';
import { errorResponse, readJsonObject } from '@/shared/http.utils';

const ID_PATTERN = /^[a-z0-9-]{1,64}$/;
/** Nombre de archivo de una fuente: sin carpetas. */
const THEME_FILE_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
/** Ruta de un archivo del deck, relativa a `assets/`: sin `..` ni rutas absolutas. */
const DECK_FILE_PATTERN = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
const MAX_FILE_BYTES = 1_000_000;
const MAX_DRAFT_CHARS = 1_000_000;
const ALLOWED_TYPES = new Set([
  'font/woff2',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const issueMessages = (issues: { path: string; message: string }[]) =>
  issues.map((i) => `${i.path}: ${i.message}`);

function fileResponse(stored: StoredFile) {
  return new Response(base64ToBytes(stored.data), {
    headers: {
      'Content-Type': stored.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}

/** Lee el cuerpo como archivo: tipo permitido y hasta 1 MB. Null si no sirve. */
async function readFile(request: Request): Promise<StoredFile | null> {
  const contentType = (request.headers.get('Content-Type') ?? '')
    .split(';')[0]
    ?.trim();
  if (!contentType || !ALLOWED_TYPES.has(contentType)) return null;
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) return null;
  return { contentType, data: bytesToBase64(bytes) };
}

/** Presentaciones y sus temas: lectura para quien tenga PIN; escritura, solo admins. */
export const decksRoute = new Hono<AppEnv>()
  .get('/decks', requireReviewer, async (c) =>
    c.json(await listDecks(c.env.DB)),
  )

  .get('/decks/:id', requireReviewer, async (c) => {
    const id = c.req.param('id');
    const deck = ID_PATTERN.test(id) ? await findDeck(c.env.DB, id) : null;
    const theme = deck ? await findTheme(c.env.DB, deck.theme) : null;
    if (!deck || !theme) return errorResponse(c, 'not_found');
    const bundle: DeckBundle = {
      deck,
      theme,
      files: await listDeckFilePaths(c.env.DB, id),
    };
    return c.json(bundle);
  })

  // Todos los temas completos: el editor cambia de tema sin pedir otra vez.
  .get('/themes', requireReviewer, async (c) =>
    c.json(await listFullThemes(c.env.DB)),
  )

  // Los archivos piden el PIN igual que todo: el visor los baja con el token y los inserta en la página.
  .get('/themes/:id/files/:file', requireReviewer, async (c) => {
    const stored = await findThemeFile(
      c.env.DB,
      c.req.param('id'),
      c.req.param('file'),
    );
    return stored ? fileResponse(stored) : errorResponse(c, 'not_found');
  })

  .get('/decks/:id/files/*', requireReviewer, async (c) => {
    const path = c.req.path.split('/files/')[1] ?? '';
    const stored = DECK_FILE_PATTERN.test(path)
      ? await findDeckFile(c.env.DB, c.req.param('id'), path)
      : null;
    return stored ? fileResponse(stored) : errorResponse(c, 'not_found');
  })

  .use('/admin/themes/*', requireReviewer, requireAdmin)
  .use('/admin/decks/*', requireReviewer, requireAdminAccess)

  .get('/admin/themes', requireReviewer, requireAdmin, async (c) =>
    c.json(await listThemes(c.env.DB)),
  )

  .put('/admin/themes/:id', async (c) => {
    const id = c.req.param('id');
    const body = await readJsonObject(c);
    if (!body)
      return errorResponse(c, 'invalid_request', ['El cuerpo no es JSON.']);
    const theme = body as unknown as Theme;
    const issues = validateTheme(theme);
    if (theme.id !== id || !ID_PATTERN.test(id))
      issues.push({
        path: 'id',
        message: 'Debe coincidir con la ruta (minúsculas, números y guiones).',
      });
    if (issues.length > 0)
      return errorResponse(c, 'invalid_request', issueMessages(issues));
    const saved = await saveTheme(
      c.env.DB,
      theme,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return c.json(saved, saved.created ? 201 : 200);
  })

  .put('/admin/themes/:id/files/:file', async (c) => {
    const id = c.req.param('id');
    const file = c.req.param('file');
    if (!THEME_FILE_PATTERN.test(file) || !(await findTheme(c.env.DB, id)))
      return errorResponse(c, 'not_found');
    const stored = await readFile(c.req.raw);
    if (!stored)
      return errorResponse(c, 'invalid_request', [
        'El archivo debe ser woff2, svg, png, jpeg o webp, de hasta 1 MB.',
      ]);
    await saveThemeFile(c.env.DB, id, file, stored);
    return c.body(null, 204);
  })

  .put('/admin/decks/:id', async (c) => {
    const id = c.req.param('id');
    const body = await readJsonObject(c);
    if (!body)
      return errorResponse(c, 'invalid_request', ['El cuerpo no es JSON.']);
    const deck = body as unknown as Deck;
    if (deck.id !== id || !ID_PATTERN.test(id))
      return errorResponse(c, 'invalid_request', [
        'El id del deck debe coincidir con la ruta (minúsculas, números y guiones).',
      ]);
    const theme = await findTheme(c.env.DB, String(deck.theme));
    if (!theme)
      return errorResponse(c, 'invalid_request', [
        `No existe el tema «${String(deck.theme)}»: súbelo primero.`,
      ]);
    const issues = validateDeck(deck, theme);
    if (issues.length > 0)
      return errorResponse(c, 'invalid_request', issueMessages(issues));
    const saved = await saveDeck(
      c.env.DB,
      deck,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return c.json(saved, saved.created ? 201 : 200);
  })

  .delete('/admin/decks/:id', async (c) => {
    const archived = await archiveDeck(
      c.env.DB,
      c.req.param('id'),
      new Date().toISOString(),
    );
    return archived ? c.body(null, 204) : errorResponse(c, 'not_found');
  })

  .get('/admin/decks/:id/draft', async (c) => {
    const draft = await findDeckDraft(c.env.DB, c.req.param('id'));
    return draft ? c.json(draft) : errorResponse(c, 'not_found');
  })

  // El borrador no se valida: puede estar a medias. Solo tiene que ser un deck con su id.
  .put('/admin/decks/:id/draft', async (c) => {
    const id = c.req.param('id');
    const body = await readJsonObject(c);
    const slides: unknown = body?.slides;
    if (!body || body.id !== id || !Array.isArray(slides))
      return errorResponse(c, 'invalid_request', [
        'El borrador debe ser un deck con el id de la ruta y una lista de slides.',
      ]);
    if (JSON.stringify(body).length > MAX_DRAFT_CHARS)
      return errorResponse(c, 'invalid_request', [
        'El borrador es demasiado grande.',
      ]);
    const saved = await saveDeckDraft(
      c.env.DB,
      id,
      body,
      new Date().toISOString(),
    );
    return saved ? c.body(null, 204) : errorResponse(c, 'not_found');
  })

  .delete('/admin/decks/:id/draft', async (c) => {
    await discardDeckDraft(c.env.DB, c.req.param('id'));
    return c.body(null, 204);
  })

  // Publicar: se valida el borrador contra su tema y pasa a ser la presentación (guarda la anterior).
  .post('/admin/decks/:id/publish', async (c) => {
    const id = c.req.param('id');
    const draft = await findDeckDraft(c.env.DB, id);
    if (!draft) return errorResponse(c, 'not_found');
    const deck = draft.content;
    const theme = await findTheme(c.env.DB, String(deck.theme));
    if (!theme)
      return errorResponse(c, 'invalid_request', [
        `No existe el tema «${String(deck.theme)}».`,
      ]);
    const issues = validateDeck(deck, theme);
    if (issues.length > 0)
      return errorResponse(c, 'invalid_request', issueMessages(issues));
    await saveDeck(
      c.env.DB,
      deck,
      c.get('reviewer').id,
      new Date().toISOString(),
    );
    return c.body(null, 204);
  })

  .put('/admin/decks/:id/files/*', async (c) => {
    const id = c.req.param('id');
    const path = c.req.path.split('/files/')[1] ?? '';
    if (!DECK_FILE_PATTERN.test(path) || !(await findDeck(c.env.DB, id)))
      return errorResponse(c, 'not_found');
    const stored = await readFile(c.req.raw);
    if (!stored)
      return errorResponse(c, 'invalid_request', [
        'El archivo debe ser woff2, svg, png, jpeg o webp, de hasta 1 MB.',
      ]);
    await saveDeckFile(c.env.DB, id, path, stored);
    return c.body(null, 204);
  });
