import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import { joinNote, noteInline, splitNote } from './note.utils';

describe('splitNote / joinNote', () => {
  it('separa la nota y deja el resto como cuerpo', () => {
    const html =
      '<p><strong>Para qué sirve.</strong> Explica <strong>algo</strong>.</p><p>Texto</p><ul><li>a</li></ul>';
    expect(splitNote(html)).toEqual({
      note: 'Explica <strong>algo</strong>.',
      body: '<p>Texto</p><ul><li>a</li></ul>',
    });
  });

  it('sin nota, todo es cuerpo; un párrafo que solo se parece no cuenta', () => {
    expect(splitNote('<p>Texto</p>')).toEqual({
      note: '',
      body: '<p>Texto</p>',
    });
    expect(splitNote('<p>Para qué sirve esto</p>').note).toBe('');
    expect(
      splitNote('<p>Antes</p><p><strong>Para qué sirve.</strong> x</p>').note,
    ).toBe('');
  });

  it('juntar lo separado devuelve el HTML original', () => {
    for (const html of [
      '<p><strong>Para qué sirve.</strong> Nota.</p><p>Cuerpo</p>',
      '<p><strong>Para qué sirve.</strong> Solo nota.</p>',
      '<p>Sin nota</p>',
      '',
    ]) {
      const { note, body } = splitNote(html);
      expect(joinNote(note, body)).toBe(html);
    }
  });

  it('una nota vacía quita el párrafo; escribir una lo agrega', () => {
    expect(joinNote('', '<p>Cuerpo</p>')).toBe('<p>Cuerpo</p>');
    expect(joinNote('  ', '<p>Cuerpo</p>')).toBe('<p>Cuerpo</p>');
    expect(joinNote('Hola', '<p>Cuerpo</p>')).toBe(
      '<p><strong>Para qué sirve.</strong> Hola</p><p>Cuerpo</p>',
    );
  });

  it('el editor de la nota entrega <p>…</p>: se queda con lo de adentro', () => {
    expect(noteInline('<p>Hola <em>[1]</em></p>')).toBe('Hola <em>[1]</em>');
    expect(noteInline('<p></p>')).toBe('');
    expect(noteInline('<p><br></p>')).toBe('');
  });

  it('todas las secciones de los documentos reales se separan y juntan sin cambios', () => {
    const dir = join(import.meta.dirname, '../../../../documents');
    let notes = 0;
    for (const name of readdirSync(dir).filter((file) =>
      file.endsWith('.json'),
    )) {
      const document = JSON.parse(
        readFileSync(join(dir, name), 'utf8'),
      ) as DocumentContent;
      for (const section of document.sections) {
        const { note, body } = splitNote(section.html);
        if (note) notes += 1;
        expect(joinNote(note, body)).toBe(section.html);
      }
    }
    expect(notes).toBeGreaterThan(0);
  });
});
