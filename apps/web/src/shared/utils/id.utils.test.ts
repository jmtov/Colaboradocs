import { describe, expect, it } from 'vitest';
import { idFromTitle, isValidId } from './id.utils';

describe('idFromTitle', () => {
  it('quita tildes y signos y une con guiones', () => {
    expect(idFromTitle('Agenda de la Gran Juntanza · 22-nov')).toBe(
      'agenda-de-la-gran-juntanza-22-nov',
    );
  });

  it('recorta a 64 caracteres sin dejar un guion al final', () => {
    const id = idFromTitle(`${'a'.repeat(63)} b`);
    expect(id).toBe('a'.repeat(63));
    expect(isValidId(id)).toBe(true);
  });

  it('devuelve vacío si no queda nada', () => {
    expect(idFromTitle('¿¡?!')).toBe('');
  });
});

describe('isValidId', () => {
  it('acepta minúsculas, números y guiones', () => {
    expect(isValidId('acta-2026-11-11')).toBe(true);
  });

  it.each(['', 'Acta', 'a b', 'ñu', 'a_b', 'a'.repeat(65)])(
    'rechaza «%s»',
    (id) => {
      expect(isValidId(id)).toBe(false);
    },
  );
});
