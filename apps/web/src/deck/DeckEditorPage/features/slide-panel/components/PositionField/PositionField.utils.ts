import {
  BLOCK_SPAN,
  type BlockKind,
  type ContentLayout,
  MAX_ROWS,
  type Placement,
} from '@colaboradocs/deck-core';

export interface Cell {
  col: number;
  row: number;
}

/**
 * El rectángulo que se arrastra de `from` a `to` (celdas desde 1), ajustado a lo que admite el
 * bloque: un bloque de ancho completo ocupa todas las columnas; los demás, entre su mínimo y su
 * máximo de columnas sin salirse de la cuadrícula. Las filas no pasan de `MAX_ROWS`.
 */
export function selectionToPlacement(
  from: Cell,
  to: Cell,
  kind: BlockKind,
  columns: number,
): Placement {
  const policy = BLOCK_SPAN[kind] ?? { min: 1, max: 1 };
  const row = Math.min(from.row, to.row);
  const rowSpan = Math.min(Math.abs(to.row - from.row) + 1, MAX_ROWS - row + 1);
  if (policy === 'fill') return { col: 1, row, span: columns, rowSpan };
  const wanted = Math.abs(to.col - from.col) + 1;
  const span = Math.min(Math.max(wanted, policy.min), policy.max, columns);
  const col = Math.min(Math.min(from.col, to.col), columns - span + 1);
  return { col, row, span, rowSpan };
}

/** Quién ocupa cada celda (índice en `body` o `null` si está libre). */
export function cellOwners(layout: ContentLayout): (number | null)[][] {
  const owners: (number | null)[][] = Array.from({ length: layout.rows }, () =>
    Array.from({ length: layout.columns }, () => null),
  );
  const mark = (at: Placement | undefined, owner: number) => {
    if (!at) return;
    for (let r = at.row; r < at.row + at.rowSpan; r++)
      for (let c = at.col; c < at.col + at.span; c++) {
        const line = owners[r - 1];
        if (line && c - 1 < layout.columns) line[c - 1] = owner;
      }
  };
  layout.blocks.forEach((at, index) => {
    mark(at, index);
  });
  return owners;
}

/** Una descripción corta de dónde está un bloque: «C2·F1 · 1×2». */
export function describePlacement(at: Placement): string {
  return `C${at.col}·F${at.row} · ${at.span}×${at.rowSpan}`;
}
