import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import migration from '../migrations/0011_document_fields_english.sql?raw';
import { resetDatabase } from './helpers';

/** Corre las sentencias de la migración (D1 `exec` no admite una sentencia en varias líneas). */
async function runMigration() {
  const statements = migration
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  await env.DB.batch(statements.map((statement) => env.DB.prepare(statement)));
}

const legacy = JSON.stringify({
  id: 'doc',
  title: 'Doc',
  tipo: 'iniciativa',
  responsable: 'Ana',
  participantes: 'Ana, Luis',
  sections: [],
});

async function insertLegacy(content: string) {
  const now = '2026-11-25T00:00:00Z';
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO documents (id, title, version, updated, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind('doc', 'Doc', '0.1', '2026-11-25', content, now, now),
    env.DB.prepare(
      'INSERT INTO document_versions (document_id, content, saved_at) VALUES (?, ?, ?)',
    ).bind('doc', content, now),
    env.DB.prepare(
      'INSERT INTO document_drafts (document_id, content, revision, updated_at) VALUES (?, ?, ?, ?)',
    ).bind('doc', content, 1, now),
  ]);
}

async function contents() {
  const read = async (table: string) => {
    const content = await env.DB.prepare(
      `SELECT content FROM ${table}`,
    ).first<string>('content');
    if (content === null) throw new Error(`${table} quedó vacía`);
    return JSON.parse(content) as Record<string, unknown>;
  };
  return {
    documents: await read('documents'),
    versions: await read('document_versions'),
    drafts: await read('document_drafts'),
  };
}

describe('migración 0011: campos del documento en inglés', () => {
  it('reescribe los documentos, sus versiones y sus borradores', async () => {
    await resetDatabase();
    await insertLegacy(legacy);
    await runMigration();
    for (const content of Object.values(await contents())) {
      expect(content).toMatchObject({
        type: 'initiative',
        owner: 'Ana',
        attendees: 'Ana, Luis',
      });
      expect(Object.keys(content)).not.toContain('tipo');
      expect(Object.keys(content)).not.toContain('responsable');
      expect(Object.keys(content)).not.toContain('participantes');
    }
  });

  it('deja igual lo que no tiene esos campos, y se puede correr dos veces', async () => {
    await resetDatabase();
    const plain = JSON.stringify({ id: 'doc', title: 'Doc', sections: [] });
    await insertLegacy(plain);
    await runMigration();
    await runMigration();
    expect((await contents()).documents).toEqual(JSON.parse(plain));
  });

  it('cada tipo viejo pasa al nuevo', async () => {
    const expected = {
      acta: 'minutes',
      iniciativa: 'initiative',
      guia: 'guide',
      otro: 'other',
    };
    for (const [old, current] of Object.entries(expected)) {
      await resetDatabase();
      await insertLegacy(JSON.stringify({ id: 'doc', tipo: old }));
      await runMigration();
      expect((await contents()).documents.type).toBe(current);
    }
  });
});
