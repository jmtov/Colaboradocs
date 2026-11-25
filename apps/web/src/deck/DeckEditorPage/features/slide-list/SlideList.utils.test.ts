import { describe, expect, it } from 'vitest';
import { slideLabel, slideSummary } from './SlideList.utils';

describe('slideLabel', () => {
  it('prefiere el título, luego el eyebrow y al final «Sin título»', () => {
    expect(
      slideLabel({
        kind: 'content',
        eyebrow: { text: 'x' },
        body: [{ kind: 'heading', title: ['Hola', 'equipo'] }],
      }),
    ).toBe('Hola equipo');
    expect(
      slideLabel({
        kind: 'content',
        body: [],
        eyebrow: { text: 'stack · lista' },
      }),
    ).toBe('stack · lista');
    expect(slideLabel({ kind: 'content', columns: 3, body: [] })).toBe(
      'Sin título',
    );
    expect(
      slideLabel({
        kind: 'content',
        body: [{ kind: 'heading', title: ['  '] }],
      }),
    ).toBe('Sin título');
  });
});

describe('slideSummary', () => {
  it('dice las columnas y, si hay más de una, las filas', () => {
    expect(slideSummary({ kind: 'content' })).toBe('1 columna');
    expect(slideSummary({ kind: 'content', columns: 3 })).toBe('3 columnas');
    expect(slideSummary({ kind: 'content', columns: 2, rows: 2 })).toBe(
      '2 columnas × 2 filas',
    );
  });
});
