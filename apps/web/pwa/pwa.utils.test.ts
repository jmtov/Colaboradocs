import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PWA } from './pwa.constants';
import { parsePwaConfig, readPwaConfig } from './pwa.utils';

const valid = {
  name: 'Juntanza Docs',
  initials: 'jo',
  colors: { bg: '#070707', face: '#FFFFFF', ink: '#070707', shadow: '#8a8a8a' },
};

describe('parsePwaConfig', () => {
  it('normaliza: iniciales en mayúscula y colores en minúscula', () => {
    expect(parsePwaConfig(valid)).toEqual({
      name: 'Juntanza Docs',
      initials: 'JO',
      colors: {
        bg: '#070707',
        face: '#ffffff',
        ink: '#070707',
        shadow: '#8a8a8a',
      },
    });
  });

  it.each([
    ['sin nombre', { ...valid, name: '  ' }, /name/],
    ['nombre muy largo', { ...valid, name: 'x'.repeat(41) }, /name/],
    ['más de tres letras', { ...valid, initials: 'ABCD' }, /initials/],
    ['iniciales con símbolos', { ...valid, initials: 'J"<' }, /initials/],
    [
      'color sin #',
      { ...valid, colors: { ...valid.colors, bg: '070707' } },
      /colors\.bg/,
    ],
    [
      'color con código dentro',
      { ...valid, colors: { ...valid.colors, ink: '#000"/><x' } },
      /colors\.ink/,
    ],
    ['falta un color', { ...valid, colors: { bg: '#000000' } }, /colors\./],
  ])('rechaza %s', (_name, value, message) => {
    expect(() => parsePwaConfig(value)).toThrow(message);
  });
});

describe('readPwaConfig', () => {
  it('sin carpeta de nodo o sin pwa.json usa la identidad neutra', () => {
    expect(readPwaConfig(null)).toBe(DEFAULT_PWA);
    expect(readPwaConfig(mkdtempSync(join(tmpdir(), 'pwa-')))).toBe(
      DEFAULT_PWA,
    );
  });

  it('lee el pwa.json de la carpeta del nodo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pwa-'));
    writeFileSync(join(dir, 'pwa.json'), JSON.stringify(valid));
    expect(readPwaConfig(dir).name).toBe('Juntanza Docs');
  });

  it('un JSON roto detiene el build con el nombre del archivo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pwa-'));
    writeFileSync(join(dir, 'pwa.json'), '{ no es json');
    expect(() => readPwaConfig(dir)).toThrow(/pwa\.json: no es un JSON válido/);
  });
});
