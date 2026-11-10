import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./App.module.css', import.meta.url), 'utf8');

/**
 * Estas pruebas cuidan la ESTRUCTURA de la transición, no el diseño: la
 * duración, la curva, la dirección y el tamaño del desplazamiento se ajustan en
 * las variables (--page-duration, --page-ease, --page-shift) y en las fases.
 */
describe('App.module.css (transición de página)', () => {
  const rule = (selector: string) =>
    new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('el contenedor anima la opacidad y el transform con las variables de duración y curva', () => {
    expect(css).toMatch(/--page-duration:\s*\d+m?s/);
    expect(css).toMatch(/--page-ease:\s*cubic-bezier\(/);
    expect(css).toMatch(/--page-shift:/);
    const base = rule('\\.page');
    expect(base).toMatch(/transition:[^;]*opacity[^;]*var\(--page-duration\)/s);
    expect(base).toMatch(
      /transition:[^;]*transform[^;]*var\(--page-duration\)/s,
    );
  });

  it('al salir se desvanece y se transforma', () => {
    const leaving = rule('\\[data-phase="leaving"\\]');
    expect(leaving).toMatch(/opacity:\s*0/);
    expect(leaving).toMatch(/transform:/);
  });

  it('al entrar arranca oculta y transformada, sin transición (es el punto de partida)', () => {
    const entering = rule('\\[data-phase="entering"\\]');
    expect(entering).toMatch(/opacity:\s*0/);
    expect(entering).toMatch(/transform:/);
    expect(entering).toMatch(/transition:\s*none/);
  });

  it('en reposo no lleva transform ni opacity (no crea contexto de apilamiento)', () => {
    expect(css).not.toMatch(/\[data-phase="idle"\]/);
    const base = rule('\\.page');
    expect(base).not.toMatch(/(^|[;\s])transform:/);
    expect(base).not.toMatch(/(^|[;\s])opacity:/);
  });

  it('mientras sale o entra no recibe clics, y con «reducir movimiento» no hay transición', () => {
    expect(rule('\\[data-phase="leaving"\\]')).toMatch(
      /pointer-events:\s*none/,
    );
    expect(rule('\\[data-phase="entering"\\]')).toMatch(
      /pointer-events:\s*none/,
    );
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{[^}]*transition-duration:\s*0s/,
    );
  });
});
