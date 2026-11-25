import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'CollapsibleSection.module.css'),
  'utf8',
);

describe('CollapsibleSection en el celular', () => {
  it('el título se alinea a la izquierda (el botón lo centra por defecto)', () => {
    expect(css).toMatch(/\.toggle \{[^}]*text-align:\s*left/);
  });

  it('el contador baja a la segunda fila, bajo el título, y el chevron queda en la primera', () => {
    const mobile =
      /@media \(width <= 640px\) \{([\s\S]*)\}\s*$/.exec(css)?.[1] ?? '';
    expect(mobile).toMatch(/\.toggle \{[^}]*display:\s*inline-grid/);
    expect(mobile).toMatch(/\.note \{[^}]*grid-row:\s*2/);
  });
});
