import { BLOCK_SPAN, MAX_ROWS, type SpanPolicy } from './deck.constants';
import type { Block, ContentSlide, Span } from './deck.types';

/** Dónde cae un elemento en la cuadrícula: columna y fila (desde 1) y cuántas ocupa. */
export interface Placement {
  col: number;
  row: number;
  span: number;
  rowSpan: number;
}

export type LayoutIssue =
  | { kind: 'overlap'; index: number }
  | { kind: 'bounds'; index: number };

export interface ContentLayout {
  columns: number;
  /** Las filas de la cuadrícula: las pedidas por la slide o las que hagan falta. */
  rows: number;
  blocks: Placement[];
  /** Bloques que se pisan o se salen de la cuadrícula; `index` es su posición en `body`. */
  issues: LayoutIssue[];
}

export const columnsOf = (slide: Pick<ContentSlide, 'columns'>): number =>
  slide.columns ?? 1;

/** Columnas que ocupa un bloque: las de la slide si es de ancho completo; si no, las que pidió dentro de su rango. */
export function blockSpan(block: Block, columns: number): number {
  const policy: SpanPolicy = BLOCK_SPAN[block.kind] ?? { min: 1, max: 1 };
  if (policy === 'fill') return columns;
  const initial = policy.wide ? columns : policy.min;
  const wanted = Math.min(
    Math.max(block.span ?? initial, policy.min),
    policy.max,
  );
  return Math.min(wanted, columns);
}

type Grid = boolean[][];

const isFree = (grid: Grid, at: Placement): boolean => {
  for (let r = at.row; r < at.row + at.rowSpan; r++)
    for (let c = at.col; c < at.col + at.span; c++)
      if (grid[r]?.[c - 1]) return false;
  return true;
};

const reserve = (grid: Grid, at: Placement) => {
  for (let r = at.row; r < at.row + at.rowSpan; r++) {
    grid[r] ??= [];
    for (let c = at.col; c < at.col + at.span; c++)
      (grid[r] as boolean[])[c - 1] = true;
  }
};

/**
 * La disposición completa de una slide de contenido, calculada de sus datos. Pura.
 *
 * Los bloques con `col` y `row` van donde dicen; los demás se acomodan en orden, en la primera
 * celda libre donde caben (por filas).
 */
export function layoutContent(slide: ContentSlide): ContentLayout {
  const columns = columnsOf(slide);
  const body = slide.body ?? [];
  const grid: Grid = [];
  const issues: LayoutIssue[] = [];

  const sizeOf = (block: Block) => ({
    span: blockSpan(block, columns),
    rowSpan: Math.max(1, Math.min(block.rowSpan ?? 1, MAX_ROWS)),
  });
  const blocks: Placement[] = new Array(body.length);

  // primero los que dicen dónde van
  body.forEach((block, index) => {
    if (block.col === undefined || block.row === undefined) return;
    const at = { col: block.col, row: block.row, ...sizeOf(block) };
    if (at.col < 1 || at.col + at.span - 1 > columns || at.row < 1)
      issues.push({ kind: 'bounds', index });
    else if (!isFree(grid, at)) issues.push({ kind: 'overlap', index });
    reserve(grid, at);
    blocks[index] = at;
  });

  // luego el resto, en orden, en la primera celda libre
  body.forEach((block, index) => {
    if (blocks[index]) return;
    const size = sizeOf(block);
    for (let row = 1; ; row++) {
      let found: Placement | undefined;
      for (let col = 1; col + size.span - 1 <= columns; col++) {
        const at = { col, row, ...size };
        if (isFree(grid, at)) {
          found = at;
          break;
        }
      }
      if (found) {
        reserve(grid, found);
        blocks[index] = found;
        break;
      }
    }
  });

  const used = Math.max(
    1,
    ...blocks.map((p) => (p ? p.row + p.rowSpan - 1 : 1)),
  );
  body.forEach((_, index) => {
    const at = blocks[index];
    if (
      at &&
      at.row + at.rowSpan - 1 > MAX_ROWS &&
      !issues.some((i) => i.index === index)
    )
      issues.push({ kind: 'bounds', index });
  });
  return {
    columns,
    rows: Math.max(slide.rows ?? 1, used),
    blocks,
    issues,
  };
}

/** Una celda de la cuadrícula: columna y fila, desde 1. */
export interface Cell {
  col: number;
  row: number;
}

/**
 * Las celdas libres de la cuadrícula de una slide, para ofrecer dónde agregar un bloque. Si las
 * filas son las que hagan falta, se ofrece además una fila nueva debajo (hasta `MAX_ROWS`); si la
 * slide fija sus filas, solo las que tiene.
 */
export function freeCells(slide: ContentSlide): Cell[] {
  const layout = layoutContent(slide);
  const rows =
    slide.rows === undefined
      ? Math.min(layout.rows + 1, MAX_ROWS)
      : layout.rows;
  const taken = new Set<string>();
  for (const at of layout.blocks)
    for (let r = at.row; r < at.row + at.rowSpan; r++)
      for (let c = at.col; c < at.col + at.span; c++) taken.add(`${c},${r}`);
  const cells: Cell[] = [];
  for (let row = 1; row <= rows; row++)
    for (let col = 1; col <= layout.columns; col++)
      if (!taken.has(`${col},${row}`)) cells.push({ col, row });
  return cells;
}

export interface TidyResult {
  columns: Span;
  rows: number;
  body: Block[];
}

/**
 * Quita de la cuadrícula las columnas y filas en las que no hay ningún bloque y corre los demás
 * para cerrar el hueco. Antes fija cada bloque donde está hoy, para que nada cambie de sitio al
 * reacomodarse. Devuelve `null` si no hay nada que quitar.
 */
export function tidyGrid(slide: ContentSlide): TidyResult | null {
  const layout = layoutContent(slide);
  const body = slide.body ?? [];
  const cols = new Set<number>();
  const rows = new Set<number>();
  for (const at of layout.blocks) {
    for (let c = at.col; c < at.col + at.span; c++) cols.add(c);
    for (let r = at.row; r < at.row + at.rowSpan; r++) rows.add(r);
  }
  const columns = Math.max(1, cols.size);
  const rowCount = Math.max(1, rows.size);
  if (columns >= layout.columns && rowCount >= layout.rows) return null;
  const rank = (used: Set<number>) =>
    new Map([...used].sort((a, b) => a - b).map((n, i) => [n, i + 1]));
  const colMap = rank(cols);
  const rowMap = rank(rows);
  return {
    columns: columns as Span,
    rows: rowCount,
    body: body.map((block, i) => {
      const at = layout.blocks[i];
      if (!at) return block;
      return {
        ...block,
        col: colMap.get(at.col) ?? at.col,
        row: rowMap.get(at.row) ?? at.row,
      };
    }),
  };
}
