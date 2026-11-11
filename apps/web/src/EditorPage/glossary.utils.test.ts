// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  formsOf,
  orphanLinks,
  parseForms,
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
