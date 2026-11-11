/** Ids de `wanted` en el orden del documento. */
export function inDocumentOrder(order: string[], wanted: Set<string>) {
  return order.filter((id) => wanted.has(id));
}

/** Índice tras avanzar (`1`) o retroceder (`-1`); da la vuelta en los extremos. */
export function stepIndex(index: number, total: number, delta: 1 | -1): number {
  if (total <= 0) return 0;
  return (((index + delta) % total) + total) % total;
}

/** Deja `index` dentro de `0..total-1`; 0 si no hay elementos. */
export function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

/** Texto en una línea, cortado en `max` caracteres con «…». */
export function excerpt(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max).trimEnd()}…`;
}

/** Ids de las viñetas bajo un título «Pendientes…» (las que cuenta el resumen). */
export function readPendingIds(root: ParentNode): Set<string> {
  const ids = new Set<string>();
  for (const heading of root.querySelectorAll('h3')) {
    if (!(heading.textContent ?? '').startsWith('Pendientes')) continue;
    const list = heading.nextElementSibling;
    if (list?.tagName !== 'UL') continue;
    for (const item of list.querySelectorAll<HTMLElement>(
      'li[data-block-id]',
    )) {
      ids.add(item.dataset.blockId ?? '');
    }
  }
  return ids;
}

/** Ids de todos los bloques de `root`, en el orden del documento. */
export function readBlockOrder(root: ParentNode): string[] {
  return [...root.querySelectorAll<HTMLElement>('[data-block-id]')]
    .map((element) => element.dataset.blockId ?? '')
    .filter(Boolean);
}
