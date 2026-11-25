import { describe, expect, it } from 'vitest';
import { iconSvg } from './icon.utils';
import { SCALE_ANY, SCALE_MASKABLE } from './pwa.constants';
import type { PwaConfig } from './pwa.types';

const phr: PwaConfig = {
  name: 'PH Rionegro Docs',
  initials: 'PHR',
  colors: { bg: '#ff8a00', face: '#fffce3', ink: '#1a1a1a', shadow: '#1a1a1a' },
};

describe('iconSvg', () => {
  it('pone los colores del nodo: fondo, cara, iniciales y sombra', () => {
    const svg = iconSvg(phr);
    expect(svg).toContain('<rect width="512" height="512" fill="#ff8a00"/>');
    expect(svg).toContain('fill="#fffce3"');
    expect(svg).toContain('>PHR</text>');
    expect(svg).toContain('<polygon');
  });

  it('el borde de la cara es del color de la sombra (forman un solo cuerpo)', () => {
    const svg = iconSvg({
      ...phr,
      colors: { ...phr.colors, shadow: '#8a8a8a' },
    });
    expect(svg).toContain('stroke="#8a8a8a" stroke-width="10"');
    expect(svg).toContain(
      '<polygon points="115,195 71,239 71,481 313,481 357,437 120,432 120,200" fill="#8a8a8a"/>',
    );
  });

  it('la letra se ajusta a cuántas son: una grande, tres apretadas', () => {
    const sizeOf = (initials: string) =>
      Number(/font-size="(\d+)"/.exec(iconSvg({ ...phr, initials }))?.[1]);
    expect(sizeOf('C')).toBeGreaterThan(sizeOf('JO'));
    expect(sizeOf('JO')).toBeGreaterThan(sizeOf('PHR'));
  });

  it('el maskable es más chico que el normal, para caber en la zona segura', () => {
    expect(SCALE_MASKABLE).toBeLessThan(SCALE_ANY);
    expect(iconSvg(phr, SCALE_MASKABLE)).toContain(`scale(${SCALE_MASKABLE})`);
    expect(iconSvg(phr)).toContain(`scale(${SCALE_ANY})`);
  });
});
