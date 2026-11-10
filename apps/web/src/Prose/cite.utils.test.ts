import { describe, expect, it } from 'vitest';
import { citeKey, parseCite } from './cite.utils';

describe('parseCite', () => {
  it('lee una lista simple de fuentes', () => {
    expect(parseCite('[2, 3]', 6)).toEqual([
      {
        label: '',
        items: [
          { number: 2, details: [] },
          { number: 3, details: [] },
        ],
      },
    ]);
  });

  it('separa grupos con etiqueta', () => {
    const groups = parseCite('[puertas abiertas: 2, 3; norte: 1, 3, 4]', 6);
    expect(groups.map((group) => group.label)).toEqual([
      'puertas abiertas',
      'norte',
    ]);
    expect(groups[1]?.items.map((item) => item.number)).toEqual([1, 3, 4]);
  });

  it('cuelga los detalles de la fuente anterior', () => {
    const [group] = parseCite('[4, princ. 2 y 10]', 6);
    expect(group?.items).toEqual([{ number: 4, details: ['princ. 2 y 10'] }]);
  });

  it('ignora los números sin fuente y los textos que no son citas', () => {
    expect(parseCite('[9]', 6)).toEqual([]);
    expect(parseCite('[1, notas]', 6)[0]?.items).toEqual([
      { number: 1, details: ['notas'] },
    ]);
    expect(parseCite('(propuesta)', 6)).toEqual([]);
  });
});

describe('citeKey', () => {
  it('quita los corchetes y lo que sigue a la «·»', () => {
    expect(citeKey('[4, princ. 7] · ver Glosario')).toBe('4, princ. 7');
  });
});
