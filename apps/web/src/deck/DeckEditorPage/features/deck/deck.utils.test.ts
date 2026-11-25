import type { Slide } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import {
  deleteIn,
  diffSlides,
  getIn,
  insertAt,
  issuesOfBlock,
  issuesOfSlide,
  moveAt,
  setIn,
} from './deck.utils';

describe('rutas', () => {
  const make = () => ({ slides: [{ body: [{ text: 'a' }, { text: 'b' }] }] });

  it('lee y escribe por ruta', () => {
    const deck = make();
    expect(getIn(deck, ['slides', 0, 'body', 1, 'text'])).toBe('b');
    setIn(deck, ['slides', 0, 'body', 1, 'text'], 'z');
    expect(deck.slides[0]?.body[1]?.text).toBe('z');
  });

  it('leer una ruta que no existe da undefined y escribir en ella falla', () => {
    expect(getIn(make(), ['slides', 3, 'x'])).toBeUndefined();
    expect(() => setIn(make(), ['slides', 3, 'x'], 1)).toThrow(/Ruta inválida/);
  });

  it('borra una clave de un objeto y un elemento de una lista', () => {
    const deck = make();
    deleteIn(deck, ['slides', 0, 'body', 0, 'text']);
    expect(deck.slides[0]?.body[0]).toEqual({});
    deleteIn(deck, ['slides', 0, 'body', 0]);
    expect(deck.slides[0]?.body).toEqual([{ text: 'b' }]);
  });
});

describe('listas', () => {
  it('inserta dentro de los límites y mueve', () => {
    const list = ['a', 'b', 'c'];
    insertAt(list, 1, 'x');
    insertAt(list, 99, 'y');
    expect(list).toEqual(['a', 'x', 'b', 'c', 'y']);
    moveAt(list, 0, 2);
    expect(list).toEqual(['x', 'b', 'a', 'c', 'y']);
  });

  it('mover fuera de la lista no cambia nada', () => {
    const list = ['a', 'b'];
    moveAt(list, 0, -1);
    moveAt(list, 1, 5);
    moveAt(list, 1, 1);
    expect(list).toEqual(['a', 'b']);
  });
});

describe('diffSlides', () => {
  const s = (title: string): Slide => ({
    kind: 'content',
    body: [{ kind: 'heading', title: [title], titleSize: 'xl' }],
  });

  it('sin cambios no hace nada', () => {
    expect(diffSlides([s('a')], [s('a')])).toEqual({ mode: 'none' });
  });

  it('cambia pocas slides: reemplaza solo esas', () => {
    expect(
      diffSlides([s('a'), s('b'), s('c')], [s('a'), s('B'), s('c')]),
    ).toEqual({ mode: 'replace', indexes: [1] });
  });

  it('cambia el número de slides o demasiadas: rehace todo', () => {
    expect(diffSlides([s('a')], [s('a'), s('b')])).toEqual({ mode: 'rebuild' });
    const many = Array.from({ length: 6 }, (_, i) => s(String(i)));
    expect(
      diffSlides(
        many,
        many.map((x) => ({ ...x, title: ['x'] })),
      ),
    ).toEqual({ mode: 'rebuild' });
  });

  it('mover una slide cambia varias posiciones: se cuenta como reemplazo de las que cambian', () => {
    expect(diffSlides([s('a'), s('b')], [s('b'), s('a')])).toEqual({
      mode: 'replace',
      indexes: [0, 1],
    });
  });
});

describe('issuesOfSlide', () => {
  const issues = [
    { path: 'slides[1].category', message: 'x' },
    { path: 'slides[10].category', message: 'y' },
    { path: 'slides[1]', message: 'z' },
    { path: 'theme', message: 'w' },
  ];

  it('toma solo las de esa slide, sin confundir 1 con 10', () => {
    expect(issuesOfSlide(issues, 1).map((i) => i.message)).toEqual(['x', 'z']);
    expect(issuesOfSlide(issues, 10).map((i) => i.message)).toEqual(['y']);
  });
});

describe('issuesOfBlock', () => {
  it('solo los de ese bloque, sin confundir 1 con 10', () => {
    const issues = [
      { path: 'slides[0].body[1]', message: 'a' },
      { path: 'slides[0].body[1].span', message: 'b' },
      { path: 'slides[0].body[10]', message: 'c' },
      { path: 'slides[1].body[1]', message: 'd' },
    ];
    expect(issuesOfBlock(issues, 0, 1).map((i) => i.message)).toEqual([
      'a',
      'b',
    ]);
  });
});
