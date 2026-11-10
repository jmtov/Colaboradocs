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
    expect(after).toMatch(/var\(--t\)/);
    // sin difuminado
    expect(after).not.toMatch(/blur|filter|box-shadow/);
    expect(css).not.toMatch(/:hover\s*\{[^}]*box-shadow/);
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
