import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'SectionCards.module.css'),
  'utf8',
);

describe('tarjetas de «Contenido del documento»', () => {
  it('miden lo que su contenido: sin altura mínima en ningún ancho', () => {
    expect(css).not.toMatch(/min-height/);
  });

  it('en el celular van en una columna', () => {
    const mobile =
      /@media \(width <= 560px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(mobile).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\)/);
  });
});
