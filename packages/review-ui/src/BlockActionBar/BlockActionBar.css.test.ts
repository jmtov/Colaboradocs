import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

/** Lo que va dentro de una regla `.clase { … }`. */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  );
}

describe('botones con borde', () => {
  it('en la barra de acciones: Comentar, OK y Cerrar tienen borde', () => {
    const css = read('./BlockActionBar.module.css');
    expect(rule(css, '.button')).toMatch(/border:\s*1px solid/);
    // Cerrar usa `.button` (mismo tamaño y borde que los demás): `.close` solo lo coloca.
    expect(rule(css, '.close')).not.toMatch(/padding|border|font-size/);
  });

  it('en el hilo: Eliminar, Responder y Marcar resuelto tienen borde', () => {
    const css = read(
      '../ThreadSheet/components/ThreadView/ThreadView.module.css',
    );
    expect(rule(css, '.link')).toMatch(/border:\s*1px solid/);
    expect(rule(css, '.link')).not.toMatch(/underline/);
  });
});
