import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('./ListFilter.module.css', import.meta.url),
  'utf8',
);

describe('resumen de ListFilter', () => {
  it('vacío no ocupa lugar: sin él no queda un hueco entre la barra y la lista', () => {
    expect(css).toMatch(/\.summary:empty \{[^}]*display:\s*none/);
    expect(css).not.toMatch(/\.summary \{[^}]*min-height/);
  });
});
