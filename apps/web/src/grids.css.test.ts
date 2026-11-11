import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

/** Bloque de una regla `.clase { … }`. */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  );
}

describe('grillas de celdas con bordes colapsados', () => {
  const grids = [
    {
      name: 'home',
      css: read('./HomePage/HomePage.module.css'),
      grid: '.grid',
      cell: '.item',
      box: '.card',
    },
    {
      name: 'resumen de la revisión',
      css: read('./ReviewSummary/ReviewSummary.module.css'),
      grid: '.summary',
      cell: '.tile',
      box: '.tile',
    },
    {
      name: 'tarjetas de sección',
      css: read('./SectionCards/SectionCards.module.css'),
      grid: '.cards',
      cell: '.card',
      box: '.card',
    },
  ];

  for (const { name, css, grid, cell, box } of grids) {
    it(`${name}: cada celda tiene su borde completo y se monta 1px sobre la vecina`, () => {
      expect(rule(css, box)).toMatch(/border:\s*1px solid/);
      expect(rule(css, cell)).toMatch(/margin:\s*0 -1px -1px 0/);
    });

    it(`${name}: la grilla compensa el margen negativo y no pone bordes propios`, () => {
      const block = rule(css, grid);
      expect(block).toMatch(/padding:\s*0 1px 1px 0/);
      expect(block).not.toMatch(/border-(top|left)/);
    });
  }
});
