/**
 * Administra temas y presentaciones (decks) en D1. Por defecto actúa sobre la base
 * LOCAL; con --remote, sobre la de producción.
 *
 *   npm run decks -w @colaboradocs/review-worker -- themes import <carpeta> [--remote]
 *       Una carpeta con `theme.json` y `fonts/` (los .woff2). Valida y guarda.
 *   npm run decks -w @colaboradocs/review-worker -- themes import-builtin [--remote]
 *       Sube el tema neutro que viaja con el código.
 *   npm run decks -w @colaboradocs/review-worker -- themes list [--remote]
 *   npm run decks -w @colaboradocs/review-worker -- import <deck.json> [--remote]
 *       Valida contra su tema (que ya tiene que estar en la base), guarda y sube la
 *       carpeta `assets/` que esté junto al deck.
 *   npm run decks -w @colaboradocs/review-worker -- list [--remote]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import {
  type Deck,
  type Theme,
  validateDeck,
  validateTheme,
} from '@colaboradocs/deck-core';
import { BUILTIN_THEMES } from '@colaboradocs/themes';
import { quote, runSql, runSqlFile, selectRows } from './d1.utils';

/** Trozos por sentencia: D1 limita cada una a ~100 KB. */
const CHUNK_CHARS = 20_000;

const TYPES: Record<string, string> = {
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const positional = args.filter((a) => a !== '--remote');

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const chunks = (text: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_CHARS) {
    out.push(text.slice(i, i + CHUNK_CHARS));
  }
  return out.length > 0 ? out : [''];
};

/** `INSERT … ON CONFLICT` con el primer trozo y `UPDATE … || trozo` con el resto. */
function upsertChunked(
  table: string,
  keys: Record<string, string>,
  extra: Record<string, string>,
  column: string,
  text: string,
): string[] {
  const [first = '', ...rest] = chunks(text);
  const cols = [...Object.keys(keys), ...Object.keys(extra), column];
  const values = [
    ...Object.values(keys),
    ...Object.values(extra),
    quote(first),
  ];
  const conflict = Object.keys(keys).join(', ');
  const where = Object.entries(keys)
    .map(([k, v]) => `${k} = ${v}`)
    .join(' AND ');
  const sets = [...Object.keys(extra), column]
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return [
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')})
     ON CONFLICT(${conflict}) DO UPDATE SET ${sets};`,
    ...rest.map(
      (chunk) =>
        `UPDATE ${table} SET ${column} = ${column} || ${quote(chunk)} WHERE ${where};`,
    ),
  ];
}

function runStatements(statements: string[]) {
  const file = join(tmpdir(), `decks-import-${Date.now()}.sql`);
  writeFileSync(file, statements.join('\n'));
  runSqlFile(file, remote);
}

const fileRow = (path: string) => {
  const type = TYPES[extname(path).toLowerCase()];
  if (!type) return fail(`Tipo de archivo no admitido: ${path}`);
  const bytes = readFileSync(path);
  if (bytes.length > 1_000_000) fail(`Pesa más de 1 MB: ${path}`);
  return { type, base64: bytes.toString('base64') };
};

function themeStatements(theme: Theme, fontsDir: string): string[] {
  const issues = validateTheme(theme);
  if (issues.length > 0)
    fail(
      `El tema no es válido:\n${issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n')}`,
    );
  const now = new Date().toISOString();
  const statements = [
    `INSERT INTO themes (id, name, content, created_at, updated_at)
     VALUES (${quote(theme.id)}, ${quote(theme.name)}, ${quote('')}, ${quote(now)}, ${quote(now)})
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at;`,
    `UPDATE themes SET content = '' WHERE id = ${quote(theme.id)};`,
    ...chunks(JSON.stringify(theme)).map(
      (chunk) =>
        `UPDATE themes SET content = content || ${quote(chunk)} WHERE id = ${quote(theme.id)};`,
    ),
  ];
  for (const font of theme.fonts) {
    statements.push(...themeFileStatements(theme.id, fontsDir, font.file));
  }
  for (const variant of Object.values(theme.variants ?? {})) {
    for (const font of variant.fonts ?? []) {
      statements.push(...themeFileStatements(theme.id, fontsDir, font.file));
    }
  }
  return statements;
}

function themeFileStatements(
  themeId: string,
  fontsDir: string,
  file: string,
): string[] {
  const path = join(fontsDir, file);
  if (!existsSync(path)) return fail(`Falta la fuente ${file} (${path}).`);
  const { type, base64 } = fileRow(path);
  return upsertChunked(
    'theme_files',
    { theme_id: quote(themeId), file: quote(file) },
    { content_type: quote(type) },
    'data',
    base64,
  );
}

function importTheme(dir: string) {
  const file = join(dir, 'theme.json');
  if (!existsSync(file)) fail(`No hay theme.json en ${dir}.`);
  const theme: Theme = JSON.parse(readFileSync(file, 'utf8'));
  runStatements(themeStatements(theme, join(dir, 'fonts')));
  console.log(`Tema «${theme.name}» (${theme.id}) guardado.`);
}

function importBuiltinThemes() {
  const fonts = join(import.meta.dirname, '../../themes/fonts');
  for (const theme of BUILTIN_THEMES) {
    runStatements(themeStatements(theme, join(fonts, theme.id)));
    console.log(`Tema «${theme.name}» (${theme.id}) guardado.`);
  }
}

function listThemes() {
  const rows = selectRows(
    runSql(
      'SELECT id, name, length(content) AS bytes FROM themes ORDER BY id',
      remote,
    ),
  );
  if (rows.length === 0) console.log('Sin temas.');
  for (const row of rows) console.log(`${row.id}  ${row.name}`);
}

function assetFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? assetFiles(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}

function importDeck(path: string) {
  const deck: Deck = JSON.parse(readFileSync(path, 'utf8'));
  const row = selectRows(
    runSql(
      `SELECT content FROM themes WHERE id = ${quote(String(deck.theme))}`,
      remote,
    ),
  )[0];
  if (!row)
    fail(
      `No existe el tema «${deck.theme}» en la base: impórtalo antes (decks themes import …).`,
    );
  const theme: Theme = JSON.parse(String(row?.content));
  const issues = validateDeck(deck, theme);
  if (issues.length > 0)
    fail(
      `El deck no es válido:\n${issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n')}`,
    );
  const now = new Date().toISOString();
  const id = quote(deck.id);
  const statements = [
    `INSERT INTO deck_versions (deck_id, content, saved_by, saved_at)
     SELECT id, content, NULL, ${quote(now)} FROM decks WHERE id = ${id};`,
    `INSERT INTO decks (id, title, theme_id, content, created_at, updated_at)
     VALUES (${id}, ${quote(deck.title)}, ${quote(deck.theme)}, '', ${quote(now)}, ${quote(now)})
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, theme_id = excluded.theme_id,
       updated_at = excluded.updated_at, archived_at = NULL;`,
    `UPDATE decks SET content = '' WHERE id = ${id};`,
    ...chunks(JSON.stringify(deck)).map(
      (chunk) =>
        `UPDATE decks SET content = content || ${quote(chunk)} WHERE id = ${id};`,
    ),
  ];
  const assets = join(dirname(path), 'assets');
  const files = existsSync(assets) ? assetFiles(assets) : [];
  for (const file of files) {
    const { type, base64 } = fileRow(file);
    statements.push(
      ...upsertChunked(
        'deck_files',
        { deck_id: id, path: quote(relative(assets, file)) },
        { content_type: quote(type) },
        'data',
        base64,
      ),
    );
  }
  runStatements(statements);
  console.log(
    `Guardado «${deck.title}» (${deck.id}): ${deck.slides.length} slides, ${files.length} archivos.`,
  );
}

function listDecks() {
  const rows = selectRows(
    runSql(
      'SELECT id, title, theme_id, updated_at, archived_at FROM decks ORDER BY updated_at DESC',
      remote,
    ),
  );
  if (rows.length === 0) console.log('Sin presentaciones.');
  for (const row of rows) {
    console.log(
      `${row.archived_at ? '(archivada) ' : ''}${row.id}  ${row.theme_id}  ${row.updated_at}  ${row.title}`,
    );
  }
}

const [command, sub, target] = positional;
if (command === 'themes' && sub === 'import' && target) importTheme(target);
else if (command === 'themes' && sub === 'import-builtin')
  importBuiltinThemes();
else if (command === 'themes' && sub === 'list') listThemes();
else if (command === 'import' && sub) importDeck(sub);
else if (command === 'list') listDecks();
else
  fail(
    'Comandos: themes import <carpeta> | themes import-builtin | themes list | import <deck.json> | list  [--remote]',
  );
