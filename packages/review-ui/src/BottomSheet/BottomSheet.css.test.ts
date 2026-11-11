import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('./BottomSheet.module.css', import.meta.url),
  'utf8',
);

describe('BottomSheet.module.css', () => {
  it('la hoja entra y sale deslizándose desde abajo, unos 500 ms, con la curva de las hojas de iOS', () => {
    expect(css).toMatch(/--sheet-duration,\s*500ms/);
    expect(css).toMatch(
      /--sheet-ease,\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/,
    );
    // fuera de pantalla por defecto; en su lugar solo con data-state="open"
    expect(css).toMatch(/\.sheet\s*\{[^}]*translateY\(calc\(100%/);
    expect(css).toMatch(
      /\.sheet\[data-state="open"\]\s*\{[^}]*translateY\(var\(--sheet-shift/,
    );
  });

  it('el fondo oscuro aparece y desaparece con la misma transición', () => {
    expect(css).toMatch(
      /\.sheet::backdrop\s*\{[^}]*opacity:\s*0[^}]*transition:\s*opacity/,
    );
    expect(css).toMatch(
      /\.sheet\[data-state="open"\]::backdrop\s*\{[^}]*opacity:\s*1/,
    );
  });

  it('con «reducir movimiento» no hay deslizamiento', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*transition-duration:\s*0s/,
    );
  });

  it('saliendo no atrapa clics, el fondo se desvanece con una sombra y la página no queda bloqueada', () => {
    // la hoja que sale no recibe clics
    expect(css).toMatch(
      /\.sheet\[data-state="closing"\]\s*\{[^}]*pointer-events:\s*none/,
    );
    // sin ::backdrop (ya no es modal), el fondo oscuro sale con una sombra que se desvanece
    expect(css).toMatch(
      /@keyframes scrim-out[\s\S]*100vmax rgb\(0 0 0 \/ 45%\)/,
    );
    // el bloqueo del scroll de la página se suelta al empezar a salir
    expect(css).toMatch(
      /:root:has\(dialog\[open\]:not\(\[data-state="closing"\]\)\)/,
    );
  });

  it('es fija abajo igual en modal y no modal (no depende de los estilos del navegador para modales)', () => {
    const sheet = /(?:^|\n)\.sheet\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(sheet).toMatch(/position:\s*fixed/);
    expect(sheet).toMatch(/inset:\s*0/);
    expect(sheet).toMatch(/z-index:\s*var\(--z-fixed\)/);
  });
});
