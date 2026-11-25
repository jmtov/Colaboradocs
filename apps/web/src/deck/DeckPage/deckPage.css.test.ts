import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('./DeckPage.module.css', import.meta.url),
  'utf8',
);
const rule = (selector: string) =>
  new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`).exec(
    css,
  )?.[1] ?? '';

describe('DeckPage.module.css', () => {
  it('la presentación y el botón de mostrar la barra comparten la misma celda (si no, la presentación se corre a una segunda columna)', () => {
    expect(rule('.full .frame')).toContain('grid-area: 1 / 1');
    expect(rule('.reveal')).toContain('grid-area: 1 / 1');
  });

  it('con la barra, la presentación va en la fila de abajo y la grilla tiene una sola columna', () => {
    expect(rule('.frame')).toContain('grid-area: 2 / 1');
    expect(rule('.page')).toContain('grid-template-columns: minmax(0, 1fr)');
  });
});
