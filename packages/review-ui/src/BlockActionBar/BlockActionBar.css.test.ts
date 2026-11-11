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

describe('botones de la barra', () => {
  it('Cerrar es un Button más: `.close` solo lo coloca, no cambia su aspecto', () => {
    const css = read('./BlockActionBar.module.css');
    expect(rule(css, '.close')).not.toMatch(/padding|border|font-size|color/);
  });
});
