import { describe, expect, it } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import { citationsTo, sameSources } from './sources.utils';

const section = (html: string): DocumentSection => ({
  id: 'a',
  num: '1',
  title: 'A',
  status: 'listo',
  html,
});

describe('sameSources', () => {
  it('iguales si coinciden orden, etiqueta y enlace', () => {
    const a = [{ label: 'X', url: 'https://x.org' }];
    expect(sameSources(a, [{ label: 'X', url: 'https://x.org' }])).toBe(true);
    expect(sameSources(a, [{ label: 'X', url: '' }])).toBe(false);
    expect(sameSources(a, [])).toBe(false);
  });
});

describe('citationsTo', () => {
  const html =
    '<p>Uno <em>[1, 2]</em> y <em>[2]</em>.</p><p>Otro <em>[2, princ. 8]</em> y <em>[1; 3]</em> y <em>énfasis</em>.</p>';

  it('cuenta las citas que apuntan a esa fuente, en cualquiera de sus formas', () => {
    expect(citationsTo([section(html)], 2, 3)).toBe(3);
    expect(citationsTo([section(html)], 1, 3)).toBe(2);
    expect(citationsTo([section(html)], 3, 3)).toBe(1);
  });

  it('suma entre secciones y no cuenta cursivas ni números fuera de rango', () => {
    expect(
      citationsTo([section(html), section('<p><em>[2]</em></p>')], 2, 3),
    ).toBe(4);
    expect(citationsTo([section('<p><em>[9]</em></p>')], 9, 3)).toBe(0);
    expect(
      citationsTo(
        [section('<p><em>[2]</em> y <em>solo énfasis</em></p>')],
        2,
        3,
      ),
    ).toBe(1);
  });
});
