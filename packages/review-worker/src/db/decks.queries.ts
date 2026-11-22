import type {
  Deck,
  DeckListItem,
  Theme,
  ThemeListItem,
} from '@colaboradocs/deck-core';

/** Un archivo guardado (fuente de un tema o archivo de un deck); `data` va en base64. */
export type StoredFile = { contentType: string; data: string };

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

export const base64ToBytes = (data: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

// ---------- Temas ----------

export async function listThemes(db: D1Database): Promise<ThemeListItem[]> {
  const { results } = await db
    .prepare('SELECT id, name, content, updated_at FROM themes ORDER BY name')
    .all<{ id: string; name: string; content: string; updated_at: string }>();
  return results.map((row) => ({
    id: row.id,
    name: row.name,
    variants: Object.keys((JSON.parse(row.content) as Theme).variants ?? {})
      .length,
    updatedAt: row.updated_at,
  }));
}

export async function findTheme(
  db: D1Database,
  id: string,
): Promise<Theme | null> {
  const row = await db
    .prepare('SELECT content FROM themes WHERE id = ?')
    .bind(id)
    .first<{ content: string }>();
  return row ? (JSON.parse(row.content) as Theme) : null;
}

/** Crea el tema o lo reemplaza. Sus archivos no se tocan. Devuelve si era nuevo. */
export async function saveTheme(
  db: D1Database,
  theme: Theme,
  reviewerId: string,
  now: string,
): Promise<{ created: boolean }> {
  const result = await db
    .prepare(
      `INSERT INTO themes (id, name, content, created_by, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, content = excluded.content,
         updated_at = excluded.updated_at
       RETURNING created_at = updated_at AS created`,
    )
    .bind(theme.id, theme.name, JSON.stringify(theme), reviewerId, now)
    .first<{ created: number }>();
  return { created: result?.created === 1 };
}

export async function saveThemeFile(
  db: D1Database,
  themeId: string,
  file: string,
  stored: StoredFile,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO theme_files (theme_id, file, content_type, data) VALUES (?, ?, ?, ?)
       ON CONFLICT(theme_id, file) DO UPDATE SET content_type = excluded.content_type, data = excluded.data`,
    )
    .bind(themeId, file, stored.contentType, stored.data)
    .run();
}

export async function findThemeFile(
  db: D1Database,
  themeId: string,
  file: string,
): Promise<StoredFile | null> {
  const row = await db
    .prepare(
      'SELECT content_type, data FROM theme_files WHERE theme_id = ? AND file = ?',
    )
    .bind(themeId, file)
    .first<{ content_type: string; data: string }>();
  return row ? { contentType: row.content_type, data: row.data } : null;
}

// ---------- Decks ----------

export async function listDecks(db: D1Database): Promise<DeckListItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, theme_id, content, updated_at FROM decks
       WHERE archived_at IS NULL ORDER BY updated_at DESC, title`,
    )
    .all<{
      id: string;
      title: string;
      theme_id: string;
      content: string;
      updated_at: string;
    }>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    themeId: row.theme_id,
    slides: (JSON.parse(row.content) as Deck).slides.length,
    updatedAt: row.updated_at,
  }));
}

/** El deck no archivado, o null. */
export async function findDeck(
  db: D1Database,
  id: string,
): Promise<Deck | null> {
  const row = await db
    .prepare('SELECT content FROM decks WHERE id = ? AND archived_at IS NULL')
    .bind(id)
    .first<{ content: string }>();
  return row ? (JSON.parse(row.content) as Deck) : null;
}

/** Crea el deck o lo reemplaza (y lo reactiva); lo anterior queda en `deck_versions`. */
export async function saveDeck(
  db: D1Database,
  deck: Deck,
  reviewerId: string,
  now: string,
): Promise<{ created: boolean }> {
  const existing = await db
    .prepare('SELECT content FROM decks WHERE id = ?')
    .bind(deck.id)
    .first<{ content: string }>();
  const content = JSON.stringify(deck);
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO decks (id, title, theme_id, content, created_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
      )
      .bind(deck.id, deck.title, deck.theme, content, reviewerId, now)
      .run();
    return { created: true };
  }
  await db.batch([
    db
      .prepare(
        'INSERT INTO deck_versions (deck_id, content, saved_by, saved_at) VALUES (?, ?, ?, ?)',
      )
      .bind(deck.id, existing.content, reviewerId, now),
    db
      .prepare(
        `UPDATE decks SET title = ?, theme_id = ?, content = ?, updated_at = ?, archived_at = NULL
         WHERE id = ?`,
      )
      .bind(deck.title, deck.theme, content, now, deck.id),
  ]);
  return { created: false };
}

/** Oculta el deck (sus comentarios se conservan). Devuelve si existía y estaba visible. */
export async function archiveDeck(
  db: D1Database,
  id: string,
  now: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      'UPDATE decks SET archived_at = ? WHERE id = ? AND archived_at IS NULL',
    )
    .bind(now, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listDeckFilePaths(
  db: D1Database,
  deckId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT path FROM deck_files WHERE deck_id = ? ORDER BY path')
    .bind(deckId)
    .all<{ path: string }>();
  return results.map((row) => row.path);
}

export async function saveDeckFile(
  db: D1Database,
  deckId: string,
  path: string,
  stored: StoredFile,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO deck_files (deck_id, path, content_type, data) VALUES (?, ?, ?, ?)
       ON CONFLICT(deck_id, path) DO UPDATE SET content_type = excluded.content_type, data = excluded.data`,
    )
    .bind(deckId, path, stored.contentType, stored.data)
    .run();
}

export async function findDeckFile(
  db: D1Database,
  deckId: string,
  path: string,
): Promise<StoredFile | null> {
  const row = await db
    .prepare(
      'SELECT content_type, data FROM deck_files WHERE deck_id = ? AND path = ?',
    )
    .bind(deckId, path)
    .first<{ content_type: string; data: string }>();
  return row ? { contentType: row.content_type, data: row.data } : null;
}
