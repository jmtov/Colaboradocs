import { TOKEN_DEFAULTS } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { HAND_RAISE_CSS } from '../components/hand-raise.utils';
import { BASE_CSS } from './base.constants';

const CSS = `${BASE_CSS}\n${HAND_RAISE_CSS}`;

/** Tamaño de cada declaración `font-size: X` y `font: peso X/interlineado familia`. */
function fontSizes(css: string): string[] {
  const sizes = [...css.matchAll(/font-size:\s*([^;}]+)/g)].map((m) =>
    (m[1] ?? '').trim(),
  );
  const shorthand = [
    ...css.matchAll(/(?<![-\w])font:\s*(?!inherit)\d+\s+([^/\s;]+)/g),
  ].map((m) => (m[1] ?? '').trim());
  return [...sizes, ...shorthand];
}

describe('tamaños de fuente', () => {
  it('todos salen de una variable: ningún rem, px ni em suelto', () => {
    const literal = fontSizes(CSS).filter((size) => !size.startsWith('var(--'));
    expect(literal).toEqual([]);
  });

  it('hay declaraciones que revisar (la prueba no pasa en vacío)', () => {
    expect(fontSizes(CSS).length).toBeGreaterThan(30);
  });

  it('cada variable de tamaño que usa el CSS existe entre los tokens', () => {
    const used = new Set(
      fontSizes(CSS).map((s) => /var\(--([\w-]+)\)/.exec(s)?.[1] ?? ''),
    );
    // --fig-size y --fig-unit son derivados de las cifras (se ajustan al ancho), no tokens editables.
    const derived = new Set(['fig-size', 'fig-unit']);
    const missing = [...used].filter(
      (name) => !(name in TOKEN_DEFAULTS) && !derived.has(name),
    );
    expect(missing).toEqual([]);
  });

  it('todo token «text-» está en uso (no hay roles huérfanos)', () => {
    const roles = Object.keys(TOKEN_DEFAULTS).filter((name) =>
      name.startsWith('text-'),
    );
    const unused = roles.filter((name) => !CSS.includes(`var(--${name})`));
    expect(unused).toEqual([]);
  });
});
