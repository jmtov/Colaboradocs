import { describe, expect, it } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import {
  sameSections,
  withGlossary,
  withoutEmptyGlossary,
} from './section.utils';

const section = (id: string, num: string, html = ''): DocumentSection => ({
  id,
  num,
  title: id,
  status: 'listo',
  html,
});

describe('sameSections', () => {
  it('iguales si todo coincide, distintas si cambia algo o el orden', () => {
    const a = [section('a', '1', '<p>x</p>'), section('b', '2')];
    expect(
      sameSections(a, [section('a', '1', '<p>x</p>'), section('b', '2')]),
    ).toBe(true);
    expect(
      sameSections(a, [section('a', '1', '<p>y</p>'), section('b', '2')]),
    ).toBe(false);
    expect(
      sameSections(a, [a[1] as DocumentSection, a[0] as DocumentSection]),
    ).toBe(false);
    expect(sameSections(a, [a[0] as DocumentSection])).toBe(false);
  });
});

describe('el glosario siempre disponible', () => {
  it('withGlossary agrega «Glosario» como anexo al final, con la primera letra libre', () => {
    const list = [section('a', '1'), section('b', 'A')];
    const result = withGlossary(list);
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'glosario']);
    expect(result[2]).toMatchObject({ num: 'B', title: 'Glosario', html: '' });
    expect(withGlossary([section('a', '1')])[1]?.num).toBe('A');
  });

  it('withGlossary no toca un documento que ya lo tiene', () => {
    const list = [section('a', '1'), section('glosario', 'A', '<dl></dl>')];
    expect(withGlossary(list)).toBe(list);
  });

  it('withoutEmptyGlossary quita el glosario solo si está vacío', () => {
    const empty = [section('a', '1'), section('glosario', 'A', '')];
    expect(withoutEmptyGlossary(empty).map((item) => item.id)).toEqual(['a']);
    const used = [
      section('a', '1'),
      section('glosario', 'A', '<dl><dt>T</dt><dd>D</dd></dl>'),
    ];
    expect(withoutEmptyGlossary(used)).toEqual(used);
    // las que no son el glosario no se tocan aunque estén vacías
    expect(withoutEmptyGlossary([section('a', '1', '')])).toHaveLength(1);
  });
});
