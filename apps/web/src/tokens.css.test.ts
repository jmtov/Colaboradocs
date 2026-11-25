import { readdirSync, readFileSync } from 'node:fs';
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

  /** Variables que no son de :root: las define editor.css para el editor de presentaciones, o las pone el código (TSX). */
  const PROVIDED = [
    '--panel-width',
    '--surface',
    '--sheet-top-gap',
    '--skeleton-w',
    '--skeleton-h',
    '--tab-w',
    '--tab-x',
  ];

  it('todo var(--token) que usa un componente está definido en :root', () => {
    const defined = new Set(
      [...css.slice(0, css.indexOf('\n}\n')).matchAll(/^\s*(--[\w-]+):/gm)].map(
        (m) => m[1],
      ),
    );
    const modules = readdirSync(new URL('./', import.meta.url), {
      recursive: true,
    })
      .map(String)
      .filter((file) => file.endsWith('.module.css'));
    const missing = new Set<string>();
    for (const file of modules) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      for (const m of source.matchAll(/var\((--[\w-]+)\s*[,)]/g)) {
        const name = m[1] ?? '';
        // las variables locales de un componente (--t, --tab-*, --sheet-*) las define el propio CSS
        if (
          !source.includes(`${name}:`) &&
          !defined.has(name) &&
          !PROVIDED.includes(name)
        )
          missing.add(name);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('Safari viejo (sin color-mix): cada token que lo usa tiene su valor ya calculado', () => {
    const tokens = [...css.matchAll(/^ {2}(--[\w-]+):[^;]*color-mix/gm)].map(
      (m) => m[1],
    );
    const fallback = css.slice(css.indexOf('@supports not (color: color-mix'));
    expect(tokens.length).toBeGreaterThan(10);
    for (const token of tokens) expect(fallback, token).toContain(`${token}:`);
  });
});
