import { describe, expect, it } from 'vitest';
import type { Block, ContentSlide } from './deck.types';
import { blockSpan, freeCells, layoutContent, tidyGrid } from './layout.utils';

const note: Block = { kind: 'note', text: 'x' };
const heading = (extra: Partial<Block> = {}): Block =>
  ({ kind: 'heading', title: ['T'], ...extra }) as Block;
const slide = (extra: Partial<ContentSlide>): ContentSlide => ({
  kind: 'content',
  body: [],
  ...extra,
});

const at = (col: number, row: number, span = 1, rowSpan = 1) => ({
  col,
  row,
  span,
  rowSpan,
});

describe('blockSpan', () => {
  it('un bloque de ancho completo ocupa todas las columnas, pida lo que pida', () => {
    expect(blockSpan({ kind: 'agenda', items: [], span: 1 }, 3)).toBe(3);
    expect(blockSpan({ kind: 'timeline', events: [] }, 4)).toBe(4);
  });

  it('el título arranca ocupando todas las columnas, pero se puede reducir', () => {
    expect(blockSpan(heading(), 3)).toBe(3);
    expect(blockSpan(heading({ span: 1 }), 3)).toBe(1);
  });

  it('el resto arranca en su mínimo y se ensancha dentro de su rango y de las columnas', () => {
    expect(blockSpan(note, 3)).toBe(1);
    expect(blockSpan({ ...note, span: 2 }, 3)).toBe(2);
    expect(blockSpan({ ...note, span: 4 }, 3)).toBe(3);
    expect(
      blockSpan({ kind: 'qr', src: 's', alt: 'a', link: 'l', span: 4 }, 4),
    ).toBe(2);
  });
});

describe('layoutContent', () => {
  it('con una columna todo va uno bajo otro, el título primero', () => {
    const layout = layoutContent(slide({ body: [heading(), note, note] }));
    expect(layout.blocks).toEqual([at(1, 1), at(1, 2), at(1, 3)]);
    expect(layout.rows).toBe(3);
  });

  it('los bloques sin posición van a la primera celda libre, por filas, al lado del título', () => {
    const layout = layoutContent(
      slide({
        columns: 3,
        body: [heading({ span: 1 }), note, note, note],
      }),
    );
    expect(layout.blocks).toEqual([at(1, 1), at(2, 1), at(3, 1), at(1, 2)]);
  });

  it('con el título de ancho completo, los bloques van debajo', () => {
    const layout = layoutContent(
      slide({ columns: 3, body: [heading(), note, note] }),
    );
    expect(layout.blocks).toEqual([at(1, 1, 3), at(1, 2), at(2, 2)]);
  });

  it('un bloque ancho que no cabe baja a la fila siguiente', () => {
    const layout = layoutContent(
      slide({
        columns: 3,
        body: [heading(), { ...note, span: 2 }, { ...note, span: 2 }, note],
      }),
    );
    expect(layout.blocks).toEqual([
      at(1, 1, 3),
      at(1, 2, 2),
      at(1, 3, 2),
      at(3, 2),
    ]);
  });

  it('un bloque con posición va donde dice y los demás se acomodan alrededor', () => {
    const layout = layoutContent(
      slide({
        columns: 2,
        body: [
          heading({ span: 1 }),
          {
            kind: 'qr',
            src: 's',
            alt: 'a',
            link: 'l',
            col: 2,
            row: 1,
            rowSpan: 2,
          },
          note,
        ],
      }),
    );
    expect(layout.blocks).toEqual([at(1, 1), at(2, 1, 1, 2), at(1, 2)]);
    expect(layout.issues).toEqual([]);
  });

  it('el título también se puede colocar: va donde dice', () => {
    const layout = layoutContent(
      slide({ columns: 2, body: [note, heading({ col: 2, row: 1, span: 1 })] }),
    );
    expect(layout.blocks).toEqual([at(1, 1), at(2, 1)]);
  });

  it('las filas de la slide se respetan aunque estén vacías', () => {
    expect(layoutContent(slide({ rows: 3, body: [note] })).rows).toBe(3);
  });

  it('avisa de los bloques que se pisan y de los que se salen de la cuadrícula', () => {
    const layout = layoutContent(
      slide({
        columns: 2,
        body: [
          { ...note, col: 1, row: 2 },
          { ...note, col: 1, row: 2 },
          { ...note, col: 3, row: 2 },
          { ...note, col: 1, row: 5 },
        ],
      }),
    );
    expect(layout.issues).toEqual([
      { kind: 'overlap', index: 1 },
      { kind: 'bounds', index: 2 },
      { kind: 'bounds', index: 3 },
    ]);
  });

  it('avisa si los bloques automáticos no caben en cuatro filas', () => {
    const body = Array.from({ length: 5 }, () => note);
    expect(layoutContent(slide({ body })).issues).toEqual([
      { kind: 'bounds', index: 4 },
    ]);
  });

  it('una slide sin bloques tiene una fila', () => {
    expect(layoutContent({ kind: 'content' })).toMatchObject({
      rows: 1,
      blocks: [],
    });
  });
});

describe('freeCells', () => {
  it('las celdas que no ocupa ningún bloque; con filas automáticas, una fila más debajo', () => {
    const cells = freeCells(
      slide({ columns: 2, body: [heading({ span: 1 }), note] }),
    );
    // el título y la nota llenan la fila 1: queda la fila nueva
    expect(cells).toEqual([
      { col: 1, row: 2 },
      { col: 2, row: 2 },
    ]);
  });

  it('con las filas fijas, solo las celdas libres de esas filas; lo ocupado por varias filas no cuenta', () => {
    const cells = freeCells(
      slide({
        columns: 2,
        rows: 2,
        body: [
          {
            kind: 'qr',
            src: 's',
            alt: 'a',
            link: 'l',
            col: 2,
            row: 1,
            rowSpan: 2,
          },
        ],
      }),
    );
    expect(cells).toEqual([
      { col: 1, row: 1 },
      { col: 1, row: 2 },
    ]);
  });

  it('no ofrece más de cuatro filas', () => {
    const body = [heading(), note, note, note];
    expect(freeCells(slide({ body })).length).toBe(0);
  });
});

describe('tidyGrid', () => {
  it('quita las columnas y filas sin bloques y corre los demás', () => {
    const out = tidyGrid(
      slide({
        columns: 4,
        rows: 4,
        body: [
          { ...note, col: 1, row: 1 },
          { ...note, col: 3, row: 1 },
          { ...note, col: 3, row: 4 },
        ],
      }),
    );
    expect(out).toMatchObject({ columns: 2, rows: 2 });
    expect(out?.body).toEqual([
      { ...note, col: 1, row: 1 },
      { ...note, col: 2, row: 1 },
      { ...note, col: 2, row: 2 },
    ]);
  });

  it('un bloque que cruza varias columnas mantiene ocupadas todas las suyas', () => {
    const out = tidyGrid(
      slide({
        columns: 4,
        rows: 1,
        body: [
          { ...note, col: 1, row: 1, span: 3 },
          { ...note, col: 1, row: 1 },
        ],
      }),
    );
    expect(out?.columns).toBe(3);
  });

  it('fija los bloques automáticos donde están hoy', () => {
    const out = tidyGrid(slide({ columns: 3, rows: 2, body: [note] }));
    expect(out).toMatchObject({ columns: 1, rows: 1 });
    expect(out?.body[0]).toMatchObject({ col: 1, row: 1 });
  });

  it('devuelve null si no hay nada que quitar', () => {
    expect(
      tidyGrid(slide({ columns: 2, body: [heading(), note, note] })),
    ).toBeNull();
  });

  it('una slide sin bloques se queda en 1 × 1', () => {
    expect(tidyGrid(slide({ columns: 3, rows: 3, body: [] }))).toMatchObject({
      columns: 1,
      rows: 1,
    });
  });
});
