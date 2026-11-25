import type { Issue, Slide } from '@colaboradocs/deck-core';

export type Path = (string | number)[];
type Container = Record<string | number, unknown>;

export function getIn(root: unknown, path: Path): unknown {
  let node: unknown = root;
  for (const key of path) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Container)[key];
  }
  return node;
}

/** Cambia un valor dentro de `root` (modifica el objeto; pensado para un borrador de `produce`). */
export function setIn(root: unknown, path: Path, value: unknown): void {
  const parent = getIn(root, path.slice(0, -1));
  const key = path[path.length - 1];
  if (key === undefined || parent === null || typeof parent !== 'object') {
    throw new Error(`Ruta inválida: ${path.join('.')}`);
  }
  (parent as Container)[key] = value;
}

/** Quita una clave de un objeto o un elemento de una lista. */
export function deleteIn(root: unknown, path: Path): void {
  const parent = getIn(root, path.slice(0, -1));
  const key = path[path.length - 1];
  if (key === undefined || parent === null || typeof parent !== 'object')
    return;
  if (Array.isArray(parent)) parent.splice(Number(key), 1);
  else delete (parent as Container)[key];
}

export function insertAt<T>(list: T[], index: number, item: T): void {
  list.splice(Math.max(0, Math.min(index, list.length)), 0, item);
}

/** Mueve un elemento; si el destino cae fuera de la lista no hace nada. */
export function moveAt<T>(list: T[], from: number, to: number): void {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  )
    return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item as T);
}

export type SlideDiff =
  | { mode: 'none' }
  | { mode: 'replace'; indexes: number[] }
  | { mode: 'rebuild' };

/**
 * Qué hay que hacer en la vista previa tras un cambio: nada, reemplazar las slides cambiadas (si
 * son pocas y el número de slides es el mismo) o dibujar todo de nuevo.
 */
export function diffSlides(
  prev: Slide[],
  next: Slide[],
  maxReplace = 3,
): SlideDiff {
  if (prev.length !== next.length) return { mode: 'rebuild' };
  const changed: number[] = [];
  next.forEach((slide, i) => {
    if (JSON.stringify(slide) !== JSON.stringify(prev[i])) changed.push(i);
  });
  if (changed.length === 0) return { mode: 'none' };
  return changed.length <= maxReplace
    ? { mode: 'replace', indexes: changed }
    : { mode: 'rebuild' };
}

/** Los problemas de validación que caen dentro de una slide (`slides[3]…`). */
export function issuesOfSlide(issues: Issue[], index: number): Issue[] {
  const prefix = `slides[${index}]`;
  return issues.filter(
    (i) =>
      i.path === prefix ||
      i.path.startsWith(`${prefix}.`) ||
      i.path.startsWith(`${prefix}[`),
  );
}

/** Los problemas de un bloque (`slides[3].body[1]…`). */
export function issuesOfBlock(
  issues: Issue[],
  slideIndex: number,
  blockIndex: number,
): Issue[] {
  const prefix = `slides[${slideIndex}].body[${blockIndex}]`;
  return issues.filter(
    (i) =>
      i.path === prefix ||
      i.path.startsWith(`${prefix}.`) ||
      i.path.startsWith(`${prefix}[`),
  );
}
