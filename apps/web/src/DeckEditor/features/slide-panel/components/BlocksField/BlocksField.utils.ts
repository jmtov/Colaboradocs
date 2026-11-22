import {
  type Block,
  blockSpan,
  type ContentSlide,
  layoutContent,
} from '@colaboradocs/deck-core';

/** Un bloque nuevo, fijado en la primera celda libre de la cuadrícula de la slide: así su lugar no depende del orden de la lista. */
export function pinnedInFirstFreeCell(
  slide: ContentSlide | undefined,
  block: Block,
): Block {
  if (!slide || (block.col !== undefined && block.row !== undefined))
    return block;
  const body = slide.body ?? [];
  const layout = layoutContent({ ...slide, body: [...body, block] });
  const at = layout.blocks[body.length];
  return at ? { ...block, col: at.col, row: at.row } : block;
}

const TEXT_KEYS = ['title', 'text', 'value', 'day', 'component', 'link'];

/** Una pista de lo que dice un bloque, para reconocerlo en la lista: su primer texto, corto. */
export function blockSummary(block: Record<string, unknown>): string {
  const lines = block.title;
  if (Array.isArray(lines) && typeof lines[0] === 'string' && lines[0].trim())
    return clip(lines.join(' '));
  for (const key of TEXT_KEYS) {
    const value = block[key];
    if (typeof value === 'string' && value.trim()) return clip(value);
  }
  const person = block.person as { name?: string } | undefined;
  if (person?.name) return clip(person.name);
  for (const key of ['items', 'events']) {
    const list = block[key];
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0] as Record<string, unknown>;
      const text = first.title ?? first.text ?? first.date;
      if (typeof text === 'string') return clip(text);
    }
  }
  return '';
}

const clip = (text: string, max = 36): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/**
 * Un bloque nuevo fijado en una celda que se eligió: si el bloque es más ancho que lo que queda
 * hasta el borde de la cuadrícula, se corre a la izquierda para que quepa.
 */
export function pinnedAt(
  slide: ContentSlide | undefined,
  block: Block,
  cell: { col: number; row: number },
): Block {
  const columns = slide?.columns ?? 1;
  const span = blockSpan(block, columns);
  return {
    ...block,
    col: Math.min(cell.col, columns - span + 1),
    row: cell.row,
  };
}
