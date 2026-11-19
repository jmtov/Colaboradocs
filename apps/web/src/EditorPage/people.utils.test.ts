import { describe, expect, it } from 'vitest';
import { addPerson, samePeople } from './people.utils';

describe('addPerson', () => {
  it('guarda cómo se escribe en minúsculas, apuntando al nombre registrado', () => {
    expect(
      addPerson({}, ' Norberto Giraldo ', 'Norberto Osbelio Giraldo Ossa'),
    ).toEqual({
      'norberto giraldo': 'Norberto Osbelio Giraldo Ossa',
    });
  });

  it('no cambia nada si ya está igual (mismo objeto)', () => {
    const terms = { ana: 'Ana López' };
    expect(addPerson(terms, 'Ana', 'Ana López')).toBe(terms);
  });

  it('un texto vacío no agrega nada', () => {
    const terms = {};
    expect(addPerson(terms, '  ', 'Ana')).toBe(terms);
  });
});

describe('samePeople', () => {
  it('compara contenido, no orden', () => {
    expect(samePeople({ a: 'A', b: 'B' }, { b: 'B', a: 'A' })).toBe(true);
    expect(samePeople({ a: 'A' }, { a: 'X' })).toBe(false);
    expect(samePeople({ a: 'A' }, {})).toBe(false);
  });
});
