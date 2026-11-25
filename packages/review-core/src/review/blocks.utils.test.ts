import { describe, expect, it } from 'vitest';
import {
  assignBlockIds,
  excerptOf,
  hashText,
  normalizeBlockText,
} from './blocks.utils';

describe('normalizeBlockText', () => {
  it('colapsa espacios y saltos de línea', () => {
    expect(normalizeBlockText('  hola \n\n  mundo\t ')).toBe('hola mundo');
  });
});

describe('hashText', () => {
  it('es determinista y distingue textos', () => {
    expect(hashText('Rectitud')).toBe(hashText('Rectitud'));
    expect(hashText('Rectitud')).not.toBe(hashText('Rectitud.'));
  });
});

describe('assignBlockIds', () => {
  it('prefija la sección y devuelve null para bloques vacíos', () => {
    const ids = assignBlockIds([
      { sectionId: 'quienes', text: 'Propósito' },
      { sectionId: 'quienes', text: '   ' },
    ]);
    expect(ids[0]).toMatch(/^quienes-[0-9a-z]+$/);
    expect(ids[1]).toBeNull();
  });

  it('numera los textos repetidos dentro de una sección', () => {
    const ids = assignBlockIds([
      { sectionId: 'a', text: 'Pendientes' },
      { sectionId: 'a', text: 'Pendientes' },
      { sectionId: 'b', text: 'Pendientes' },
    ]);
    expect(ids[1]).toBe(`${ids[0]}-2`);
    expect(ids[2]).not.toBe(ids[0]);
  });

  it('no depende del formato del espacio en blanco', () => {
    const [a] = assignBlockIds([{ sectionId: 's', text: 'uno  dos' }]);
    const [b] = assignBlockIds([{ sectionId: 's', text: 'uno\n dos ' }]);
    expect(a).toBe(b);
  });

  it('cambia el id cuando cambia el texto', () => {
    const [a] = assignBlockIds([{ sectionId: 's', text: 'uno' }]);
    const [b] = assignBlockIds([{ sectionId: 's', text: 'uno!' }]);
    expect(a).not.toBe(b);
  });
});

describe('excerptOf', () => {
  it('deja el texto corto igual y corta el largo con elipsis', () => {
    expect(excerptOf('corto')).toBe('corto');
    const long = 'x'.repeat(200);
    const excerpt = excerptOf(long);
    expect(excerpt.length).toBe(80);
    expect(excerpt.endsWith('…')).toBe(true);
  });
});
