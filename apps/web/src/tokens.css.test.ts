import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('tokens de index.css', () => {
  it('la curva de las hojas de iOS vive solo aquí (los componentes usan --ease-smooth)', () => {
    expect(css).toMatch(
      /--ease-smooth:\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/,
    );
  });

  it('el ancho de borde, el peso y el tamaño relativo de la letra tienen su variable', () => {
    expect(css).toMatch(/--border-w:\s*1px/);
    expect(css).toMatch(/--border-w-strong:\s*2px/);
    expect(css).toMatch(/--font-weight-medium:\s*500/);
    expect(css).toMatch(/--font-scale-sm:\s*0\.75em/);
  });

  it('hay variables para colores fijos, sombras, transiciones y radios', () => {
    for (const token of [
      '--paper',
      '--on-danger',
      '--warn-mark',
      '--scrim',
      '--shadow-sheet',
      '--duration-base',
      '--duration-sheet',
      '--ease',
      '--ease-smooth',
      '--radius-circle',
      '--radius-pill',
    ]) {
      expect(css, token).toMatch(new RegExp(`${token}:`));
    }
  });
});
