import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('index.css', () => {
  it('el despegue y la sombra salen de una sola variable animada (--t), registrada con @property', () => {
    expect(css).toMatch(/@property --t\s*\{[^}]*syntax:\s*"<length>"/);
    // el hover solo cambia --t; el movimiento y la sombra se derivan de ella
    expect(/:hover\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /--t:\s*var\(--lift\)/,
    );
    expect(css).toMatch(/transform:\s*translate\(var\(--t\)/);
    // y esa variable se anima: con transición se mueven y crecen a la par
    expect(css).toMatch(/transition:\s*--t\s+\d+ms/);
  });

  it('la sombra es un pseudo-elemento sólido y largo (relleno), no un box-shadow', () => {
    const after = /\)::after\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(after).toMatch(/content:/);
    expect(after).toMatch(/clip-path:\s*polygon/);
    expect(after).toMatch(/var\(--s\)/);
    // sin difuminado
    expect(after).not.toMatch(/blur|filter|box-shadow/);
    expect(css).not.toMatch(/:hover\s*\{[^}]*box-shadow/);
  });

  it('hover sobresale --lift; al presionar o encendido la cara se hunde lo mismo, recortada por el marco', () => {
    const active = /:active\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(active).toMatch(/--t:\s*calc\(var\(--lift\) \* -1\)/);
    // un botón encendido (aria-pressed) se hunde igual, también en pantallas táctiles
    const pressed =
      /\[aria-pressed="true"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(pressed).toMatch(/--t:\s*calc\(var\(--lift\) \* -1\)/);
    // el marco recorta siempre (no solo al presionar): así al soltar nada asoma de golpe
    const base =
      /\)\s*\{([^{}]*clip-path:\s*inset\([^{}]*)\}/.exec(css)?.[1] ?? '';
    expect(base).toMatch(/clip-path:\s*inset\(\s*-8px -8px/);
    expect(base).toMatch(
      /clamp\(0px, calc\(\(var\(--t\) \+ 0\.5px\) \* 1000\), 8px\)/,
    );
    expect(active).not.toMatch(/clip-path/);
    expect(pressed).not.toMatch(/clip-path/);
    // hundido, el marco se ve del lado contrario (::before) y no hay sombra larga
    const hole = /\)::before\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(hole).toMatch(/clip-path:\s*polygon/);
    expect(hole).toMatch(/var\(--d\)/);
    expect(hole).toMatch(/pointer-events:\s*none/);
    // lo levantado (--s) y lo hundido (--d) salen de --t y nunca son negativos
    expect(css).toMatch(/--s:\s*max\(var\(--t\), 0px\)/);
    expect(css).toMatch(/--d:\s*max\(calc\(var\(--t\) \* -1\), 0px\)/);
  });

  it('la sombra es del color del borde: --line-strong por defecto, y cada botón con otro borde lo declara', () => {
    expect(css).toMatch(/--lift-color:\s*var\(--line-strong\);/);
    expect(css).toMatch(/background:\s*var\(--lift-color/);
    expect(css).not.toMatch(/background:\s*var\(--lift-color,\s*currentColor/);
  });

  it('la sombra solo recibe clics con el cursor encima (no amplía la zona clicable en reposo)', () => {
    expect(css).toMatch(/\)::after\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/:hover::after\s*\{[^}]*pointer-events:\s*auto/);
  });

  it('solo se aplica con cursor real, y no a lo deshabilitado ni a lo marcado como plano', () => {
    expect(css).toMatch(/@media \(hover: hover\)/);
    expect(css).toContain('button:not(:disabled):not([data-flat])');
  });

  it('todas las esquinas son rectas', () => {
    expect(css).toMatch(/border-radius:\s*0/);
  });
});
