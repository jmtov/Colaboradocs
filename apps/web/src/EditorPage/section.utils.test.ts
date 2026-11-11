import { describe, expect, it } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import { joinGlossary, sameSections, splitGlossary } from './section.utils';

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

describe('el glosario fuera del editor', () => {
  const DL = '<dl><dt>T</dt><dd>D</dd></dl>';

  it('splitGlossary separa la sección glosario y recuerda dónde estaba', () => {
    const list = [
      section('a', '1'),
      { ...section('glosario', 'A', DL), description: 'Palabras' },
      section('b', 'B'),
    ];
    const { main, glossary } = splitGlossary(list);
    expect(main.map((item) => item.id)).toEqual(['a', 'b']);
    expect(glossary).toMatchObject({
      html: DL,
      at: 1,
      meta: { num: 'A', title: 'glosario', description: 'Palabras' },
    });
  });

  it('joinGlossary devuelve lo mismo que se separó, sin cambios', () => {
    const list = [
      section('a', '1'),
      section('glosario', 'A', DL),
      section('b', 'B'),
    ];
    const { main, glossary } = splitGlossary(list);
    expect(joinGlossary(main, glossary)).toEqual(list);
  });

  it('un glosario vacío no se guarda; con términos, va como anexo con la primera letra libre', () => {
    const { main, glossary } = splitGlossary([
      section('a', '1'),
      section('b', 'A'),
    ]);
    expect(glossary.html).toBe('');
    expect(joinGlossary(main, glossary)).toBe(main);
    const used = joinGlossary(main, { ...glossary, html: DL });
    expect(used.map((item) => item.id)).toEqual(['a', 'b', 'glosario']);
    expect(used[2]).toMatchObject({ num: 'B', title: 'Glosario' });
  });

  it('si su letra la tomó otro anexo, usa la primera libre', () => {
    const { glossary } = splitGlossary([section('glosario', 'A', DL)]);
    const result = joinGlossary([section('x', 'A')], glossary);
    expect(result.find((item) => item.id === 'glosario')?.num).toBe('B');
  });
});
