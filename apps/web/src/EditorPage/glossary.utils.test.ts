// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  buildGlossary,
  formsOf,
  orphanLinks,
  parseForms,
  parseGlossary,
  plainDefinition,
  readTerms,
  sameLinks,
  withForms,
  withoutLink,
} from './glossary.utils';

const links = { quórum: 'Quórum', veeduría: 'Veeduría', veedurías: 'Veeduría' };

describe('readTerms', () => {
  it('lee los <dt>, con su formato quitado y sin repetir', () => {
    const html =
      '<dl><dt>Quórum</dt><dd>Mínimo.</dd><dt><strong>AMO</strong></dt><dd>x</dd><dt>Quórum</dt><dd>otra vez</dd></dl>';
    expect(readTerms(html)).toEqual(['Quórum', 'AMO']);
    expect(readTerms('')).toEqual([]);
  });
});

describe('formas', () => {
  it('parseForms: minúsculas, sin vacíos ni repetidos', () => {
    expect(parseForms(' Veeduría, veedurías ,, VEEDURÍA ')).toEqual([
      'veeduría',
      'veedurías',
    ]);
    expect(parseForms('')).toEqual([]);
  });

  it('formsOf: cómo aparece un término hoy', () => {
    expect(formsOf(links, 'Veeduría')).toEqual(['veeduría', 'veedurías']);
    expect(formsOf(links, 'Nada')).toEqual([]);
  });

  it('withForms reemplaza las formas de ese término y deja las demás', () => {
    expect(withForms(links, 'Veeduría', 'veeduría')).toEqual({
      quórum: 'Quórum',
      veeduría: 'Veeduría',
    });
    expect(withForms(links, 'Veeduría', '')).toEqual({ quórum: 'Quórum' });
    expect(withForms({}, 'AMO', 'amo, A.M.O.')).toEqual({
      amo: 'AMO',
      'a.m.o.': 'AMO',
    });
  });
});

describe('enlaces huérfanos', () => {
  it('son los que apuntan a un término que ya no existe', () => {
    expect(orphanLinks(links, ['Quórum'])).toEqual([
      ['veeduría', 'Veeduría'],
      ['veedurías', 'Veeduría'],
    ]);
    expect(orphanLinks(links, ['Quórum', 'Veeduría'])).toEqual([]);
  });

  it('withoutLink quita una forma', () => {
    expect(withoutLink(links, 'veedurías')).toEqual({
      quórum: 'Quórum',
      veeduría: 'Veeduría',
    });
  });
});

describe('sameLinks', () => {
  it('iguales sin importar el orden', () => {
    expect(sameLinks({ a: 'A', b: 'B' }, { b: 'B', a: 'A' })).toBe(true);
    expect(sameLinks({ a: 'A' }, { a: 'B' })).toBe(false);
    expect(sameLinks({ a: 'A' }, {})).toBe(false);
  });
});

describe('parseGlossary / buildGlossary', () => {
  it('lee términos con su definición y conserva lo que no es una lista', () => {
    const { rest, entries } = parseGlossary(
      '<p>Intro</p><dl><dt>Quórum</dt><dd>Mínimo <em>[2]</em></dd><dt>AMO</dt><dd>Otra</dd></dl>',
    );
    expect(rest).toBe('<p>Intro</p>');
    expect(entries).toEqual([
      {
        term: 'Quórum',
        definition: 'Mínimo [2]',
        defs: ['Mínimo <em>[2]</em>'],
      },
      { term: 'AMO', definition: 'Otra', defs: ['Otra'] },
    ]);
  });

  it('buildGlossary vuelve a escribirlo igual, y sin términos no deja lista', () => {
    const html =
      '<p>Intro</p><dl><dt>Quórum</dt><dd>Mínimo <em>[2]</em></dd></dl>';
    const { rest, entries } = parseGlossary(html);
    expect(buildGlossary(rest, entries)).toBe(html);
    expect(buildGlossary(rest, [])).toBe('<p>Intro</p>');
    expect(buildGlossary('', [])).toBe('');
  });

  it('escapa el texto escrito a mano', () => {
    expect(plainDefinition('a < b & c')).toBe('a &lt; b &amp; c');
  });
});
