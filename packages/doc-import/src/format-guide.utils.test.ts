import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ALLOWED_HTML_TAGS,
  MAX_SECTIONS,
  sanitizeSectionHtml,
  validateDocument,
} from '@juntanza/review-core';
import { describe, expect, it } from 'vitest';
import { buildFormatGuide } from './format-guide.utils';

const exampleJson = readFileSync(
  fileURLToPath(new URL('../../../documents/example.json', import.meta.url)),
  'utf8',
);

describe('buildFormatGuide', () => {
  const guide = buildFormatGuide(exampleJson);

  it('trae el ejemplo completo en un bloque json que la página acepta', () => {
    const match = /```json\n([\s\S]*?)\n```/.exec(guide);
    expect(match).not.toBeNull();
    const embedded = JSON.parse(match?.[1] ?? 'null');
    expect(embedded).toEqual(JSON.parse(exampleJson));
    expect(validateDocument(embedded).ok).toBe(true);
  });

  it('lista cada etiqueta que la página conserva, y solo esas', () => {
    for (const tag of ALLOWED_HTML_TAGS) {
      expect(guide).toContain(`\`${tag}\``);
      expect(sanitizeSectionHtml(`<${tag}>x</${tag}>`)).toContain(`<${tag}>`);
    }
    expect(sanitizeSectionHtml('<table>x</table>')).toBe('x');
  });

  it('usa los límites reales de la validación', () => {
    expect(guide).toContain(`hasta ${MAX_SECTIONS}`);
  });

  it('le dice a Claude qué hacer y cómo se sube', () => {
    expect(guide).toContain('**Para Claude:**');
    expect(guide).toContain('Subir documento');
  });
});
