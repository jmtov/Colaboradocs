import { describe, expect, it } from 'vitest';
import { findPeople } from './people.utils';

const people = {
  'norberto giraldo': 'Norberto Osbelio Giraldo Ossa',
  'juan pablo cardona': 'Juan Pablo Cardona',
  'juan cardona': 'Juan Cardona',
};

describe('findPeople', () => {
  it('encuentra cada aparición con su nombre registrado', () => {
    const text = 'Lleva Norberto Giraldo; también norberto giraldo.';
    expect(findPeople(text, people)).toEqual([
      { start: 6, end: 22, name: 'Norberto Osbelio Giraldo Ossa' },
      { start: 32, end: 48, name: 'Norberto Osbelio Giraldo Ossa' },
    ]);
  });

  it('el nombre más largo gana sobre el más corto', () => {
    expect(findPeople('Juan Pablo Cardona opina', people)).toEqual([
      { start: 0, end: 18, name: 'Juan Pablo Cardona' },
    ]);
  });

  it('no enlaza dentro de otra palabra', () => {
    expect(findPeople('Los Norberto Giraldoz', people)).toEqual([]);
  });

  it('sin personas o sin coincidencias, nada', () => {
    expect(findPeople('Hola', people)).toEqual([]);
    expect(findPeople('Norberto Giraldo', {})).toEqual([]);
  });
});
