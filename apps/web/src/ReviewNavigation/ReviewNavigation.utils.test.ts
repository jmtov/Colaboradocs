// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { countPending } from '@/content/content.utils';
import { buildProse } from '@/Prose/buildProse';
import {
  clampIndex,
  excerpt,
  inDocumentOrder,
  readBlockOrder,
  readPendingIds,
  stepIndex,
} from './ReviewNavigation.utils';

describe('stepIndex', () => {
  it('avanza y retrocede', () => {
    expect(stepIndex(1, 5, 1)).toBe(2);
    expect(stepIndex(1, 5, -1)).toBe(0);
  });
  it('da la vuelta en los extremos', () => {
    expect(stepIndex(4, 5, 1)).toBe(0);
    expect(stepIndex(0, 5, -1)).toBe(4);
  });
  it('con un solo elemento se queda; sin elementos da 0', () => {
    expect(stepIndex(0, 1, 1)).toBe(0);
    expect(stepIndex(0, 0, 1)).toBe(0);
  });
});

describe('clampIndex', () => {
  it('deja el índice dentro del rango', () => {
    expect(clampIndex(7, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(1, 3)).toBe(1);
    expect(clampIndex(5, 0)).toBe(0);
  });
});

describe('inDocumentOrder', () => {
  it('ordena por el documento, no por el conjunto', () => {
    expect(inDocumentOrder(['a', 'b', 'c', 'd'], new Set(['d', 'b']))).toEqual([
      'b',
      'd',
    ]);
  });
});

describe('excerpt', () => {
  it('une espacios y corta con «…»', () => {
    expect(excerpt('  uno \n  dos  ', 50)).toBe('uno dos');
    expect(excerpt('abcdefghij', 4)).toBe('abcd…');
  });
});

describe('bloques reales de un documento', () => {
  const html =
    '<p>Intro</p><h3>Pendientes por definir</h3><ul><li>Uno</li><li>Dos</li></ul><h3>Otro</h3><ul><li>No cuenta</li></ul>';
  const root = buildProse(html, { sectionId: 's', reviewable: true });

  it('lee los bloques en orden', () => {
    expect(readBlockOrder(root)).toHaveLength(4);
  });

  it('las viñetas pendientes son las mismas que cuenta el resumen', () => {
    const ids = readPendingIds(root);
    expect(ids.size).toBe(2);
    expect(ids.size).toBe(
      countPending({ id: 's', num: '1', title: 't', status: 'borrador', html }),
    );
    const texts = [...ids].map(
      (id) => root.querySelector(`[data-block-id="${id}"]`)?.textContent,
    );
    expect(texts).toEqual(['Uno', 'Dos']);
  });
});
