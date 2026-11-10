/**
 * Administra los documentos y el espacio en D1. Por defecto actúa sobre la base
 * LOCAL; con --remote, sobre la de producción.
 *
 *   npm run documents -w @juntanza/review-worker -- import documento.json [--remote]
 *       Valida el JSON y lo guarda; si el id ya existe lo reemplaza (y guarda la versión anterior).
 *   npm run documents -w @juntanza/review-worker -- list [--remote]
 *   npm run documents -w @juntanza/review-worker -- space [--name "…"] [--description "…"] \
 *       [--role-label "Municipio"] [--role-format "Representante {value}"] [--remote]
 *       Cambia solo lo que se indica; sin opciones muestra el espacio actual.
 *
 * Para subir documentos desde la app (admins) no hace falta esto: el CLI sirve
 * para el primer documento, para importar en lote y como respaldo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDocument, validateSpace } from '@juntanza/review-core';
import { quote, runSql, runSqlFile, selectRows } from './d1.utils';

/** Trozos de contenido por sentencia: D1 limita cada una a ~100 KB. */
const CHUNK_CHARS = 20_000;

const args = process.argv.slice(2);
const command = args[0];
const remote = args.includes('--remote');
const flag = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

function importDocument(path: string) {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const result = validateDocument(raw);
  if (!result.ok) {
    console.error(
      `El documento no es válido:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`,
    );
    process.exit(1);
  }
  const document = result.value;
  const content = JSON.stringify(document);
  const now = new Date().toISOString();
  const id = quote(document.id);

  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += CHUNK_CHARS) {
    chunks.push(content.slice(i, i + CHUNK_CHARS));
  }
  const statements = [
    // Lo que había queda como versión anterior.
    `INSERT INTO document_versions (document_id, content, saved_by, saved_at)
     SELECT id, content, NULL, ${quote(now)} FROM documents WHERE id = ${id};`,
    `INSERT INTO documents (id, title, description, version, updated, content, created_by, created_at, updated_at)
     VALUES (${id}, ${quote(document.title)}, ${document.description ? quote(document.description) : 'NULL'},
             ${quote(document.version)}, ${quote(document.updated)}, ${quote(chunks[0] ?? '')}, NULL, ${quote(now)}, ${quote(now)})
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description,
       version = excluded.version, updated = excluded.updated, content = excluded.content,
       updated_at = excluded.updated_at, archived_at = NULL;`,
    ...chunks
      .slice(1)
      .map(
        (chunk) =>
          `UPDATE documents SET content = content || ${quote(chunk)} WHERE id = ${id};`,
      ),
  ];

  const file = join(tmpdir(), `documents-import-${Date.now()}.sql`);
  writeFileSync(file, statements.join('\n'));
  runSqlFile(file, remote);
  console.log(
    `Guardado «${document.title}» (${document.id}): ${document.sections.length} secciones, ${Math.round(content.length / 1024)} KB.`,
  );

  const legacyRole = (raw as { roleField?: unknown }).roleField;
  if (legacyRole) {
    console.log(
      `\nEl JSON trae «roleField», que ahora es del espacio y no se guardó con el documento.\nPásalo con: npm run documents -- space --role-label "${(legacyRole as { label?: string }).label ?? ''}" --role-format "${(legacyRole as { format?: string }).format ?? ''}"${remote ? ' --remote' : ''}`,
    );
  }
}

function listDocuments() {
  const rows = selectRows(
    runSql(
      `SELECT id, title, version, updated, length(content) AS bytes, archived_at FROM documents ORDER BY updated DESC`,
      remote,
    ),
  );
  if (rows.length === 0) console.log('Sin documentos.');
  for (const row of rows) {
    console.log(
      `${row.archived_at ? '(archivado) ' : ''}${row.id}  v${row.version}  ${row.updated}  ${Math.round(Number(row.bytes) / 1024)} KB  ${row.title}`,
    );
  }
}

function space() {
  const rows = selectRows(
    runSql("SELECT value FROM settings WHERE key = 'space'", remote),
  );
  const current = rows[0]
    ? JSON.parse(String(rows[0].value))
    : { name: 'Documentos' };
  const next = { ...current };
  if (flag('name')) next.name = flag('name');
  if (flag('description')) next.description = flag('description');
  if (flag('role-label')) {
    next.roleField = {
      label: flag('role-label'),
      ...(flag('role-format') ? { format: flag('role-format') } : {}),
    };
  }
  const changed = JSON.stringify(next) !== JSON.stringify(current);
  if (changed) {
    const result = validateSpace(next);
    if (!result.ok) {
      console.error(
        `Datos inválidos:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`,
      );
      process.exit(1);
    }
    runSql(
      `INSERT INTO settings (key, value) VALUES ('space', ${quote(JSON.stringify(result.value))})
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      remote,
    );
  }
  console.log(JSON.stringify(changed ? next : current, null, 2));
}

switch (command) {
  case 'import': {
    const file = args[1];
    if (!file || file.startsWith('--')) {
      console.error('Uso: documents import <documento.json> [--remote]');
      process.exit(1);
    }
    importDocument(file);
    break;
  }
  case 'list':
    listDocuments();
    break;
  case 'space':
    space();
    break;
  default:
    console.error(
      'Comandos: import <archivo.json> | list | space [--name …] [--remote]',
    );
    process.exit(1);
}
