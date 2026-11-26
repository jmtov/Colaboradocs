import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// happy-dom no aplica las media queries: se prueba lo que declara el CSS.
const css = readFileSync(
  new URL('./EditorToolbar.module.css', import.meta.url),
  'utf8',
);
const [wide = '', narrow = ''] = css.split('@media (width <= 640px)');

describe('barra del editor según el ancho', () => {
  it('ancha: los grupos a la vista y sin los botones de las hojas', () => {
    expect(wide).toMatch(/\.compact\s*\{\s*display: none;/);
    expect(wide).not.toMatch(/\.wide\s*\{/);
  });

  it('angosta: una sola fila, sin los grupos y con los botones de las hojas', () => {
    expect(narrow).toMatch(/flex-wrap: nowrap;/);
    expect(narrow).toMatch(/\.wide\s*\{\s*display: none;/);
    expect(narrow).toMatch(/\.compact\s*\{\s*display: flex;/);
  });
});
