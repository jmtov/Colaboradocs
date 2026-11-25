import { COLUMN_COUNTS, MAX_ROWS } from '@colaboradocs/deck-core';

/** Cuántas celdas hay por lado en el selector: lo máximo que admite la cuadrícula. */
export const GRID_SIDE = Math.max(COLUMN_COUNTS.length, MAX_ROWS);

/** ¿Está sombreada la celda (columna y fila desde 1) en una cuadrícula de `columns` × `rows`? */
export const isShaded = (
  col: number,
  row: number,
  columns: number,
  rows: number,
): boolean => col <= columns && row <= rows;

/** El texto de un tamaño: «3 × 2». */
export const describeGrid = (columns: number, rows: number): string =>
  `${columns} × ${rows}`;
