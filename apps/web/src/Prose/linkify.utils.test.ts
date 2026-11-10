import { describe, expect, it } from 'vitest';
import { findLinks as find } from './linkify.utils';

const TERMS = {
  consenso: 'Consenso',
  veedurías: 'Veeduría',
  'municipio inactivo': 'Municipio inactivo',
  amo: 'AMO',
  aval: 'Aval',
};

const findLinks = (
  text: string,
  seen: Set<string>,
  options?: { linkTerms: boolean },
) => find(text, seen, options, TERMS);

describe('findLinks', () => {
  it('encuentra términos del glosario y referencias a secciones', () => {
    const text = 'Se requiere consenso, ver sección 2.';
    const links = findLinks(text, new Set());
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ kind: 'term', label: 'Consenso' });
    expect(links[1]).toMatchObject({ kind: 'section', sectionNumber: '2' });
    const [term] = links;
    expect(term && text.slice(term.start, term.end)).toBe('consenso');
  });

  it('enlaza cada término una sola vez por sección', () => {
    const seen = new Set<string>();
    expect(findLinks('consenso y consenso', seen)).toHaveLength(1);
    expect(findLinks('otra vez consenso', seen)).toHaveLength(0);
  });

  it('reconoce plurales como el mismo término', () => {
    const [link] = findLinks('las veedurías', new Set());
    expect(link).toMatchObject({ kind: 'term', label: 'Veeduría' });
  });

  it('no parte palabras más largas', () => {
    expect(findLinks('amontonar avalancha', new Set())).toHaveLength(0);
  });

  it('prefiere el término más largo', () => {
    const [link] = findLinks('un municipio inactivo', new Set());
    expect(link).toMatchObject({ label: 'Municipio inactivo' });
  });

  it('con linkTerms apagado deja solo las secciones', () => {
    const links = findLinks('consenso, sección 3', new Set(), {
      linkTerms: false,
    });
    expect(links).toHaveLength(1);
    expect(links[0]?.kind).toBe('section');
  });
});
