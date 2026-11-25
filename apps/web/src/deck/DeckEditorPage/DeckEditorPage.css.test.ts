import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'DeckEditorPage.module.css'),
  'utf8',
);

describe('scroll del editor de presentaciones', () => {
  it('la lista y el panel no pasan su scroll a la página al llegar a un extremo', () => {
    for (const name of ['list', 'panel']) {
      const rule = new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
      expect(rule, name).toMatch(/overscroll-behavior:\s*contain/);
    }
  });
});

describe('la barra y la hoja del panel', () => {
  it('la barra va por encima de la hoja (z-chrome), así la hoja no necesita medir dónde empieza', () => {
    expect(css).toMatch(/\.toolbar \{[^}]*z-index:\s*var\(--z-chrome\)/);
  });
});
