// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import { buildProse } from '../Prose/buildProse';
import { roundTrip } from './editor.html';

const dir = join(import.meta.dirname, '../../../../documents');
// Los documentos propios (gitignorados) también entran si están en la carpeta.
const documents = readdirSync(dir)
  .filter((name) => name.endsWith('.json'))
  .map(
    (name) =>
      JSON.parse(readFileSync(join(dir, name), 'utf8')) as DocumentContent,
  );

const blockIds = (html: string, sectionId: string) =>
  [
    ...buildProse(html, { sectionId, reviewable: true }).querySelectorAll(
      '[data-block-id]',
    ),
  ].map((element) => element.getAttribute('data-block-id'));

describe('documentos reales a través del editor', () => {
  for (const document of documents) {
    for (const section of document.sections) {
      it(`${document.id} / ${section.id}: mismo HTML y mismos ids de bloque`, () => {
        const out = roundTrip(section.html);
        expect(blockIds(out, section.id)).toEqual(
          blockIds(section.html, section.id),
        );
        expect(out).toBe(section.html);
      });
    }
  }
});
