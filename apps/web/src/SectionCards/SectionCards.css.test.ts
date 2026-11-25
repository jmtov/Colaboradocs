import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'SectionCards.module.css'),
  'utf8',
);

describe('SectionCards en el celular', () => {
  it('una columna: la tarjeta mide lo que su contenido, sin la altura mínima de la cuadrícula', () => {
    const mobile =
      /@media \(width <= 560px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(mobile).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(mobile).toMatch(/\.card \{[^}]*min-height:\s*0/);
  });

  it('en escritorio conserva la altura mínima', () => {
    expect(css).toMatch(/\.card \{[^}]*min-height:\s*10\.5rem/);
  });
});
