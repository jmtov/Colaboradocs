import type { DocumentSection, DocumentSource } from '@/content/content.types';
import { parseCite } from '@/Prose/cite.utils';

/** Las dos listas de fuentes dicen lo mismo (mismo orden, etiquetas y enlaces). */
export function sameSources(a: DocumentSource[], b: DocumentSource[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (source, index) =>
        source.label === b[index]?.label && source.url === b[index]?.url,
    )
  );
}

const CITATIONS = /<em>(\[[^<]*\])<\/em>/g;

/**
 * Cuántas citas del texto apuntan a la fuente número `number` (1 = la primera).
 * Las citas son texto como «[2, 3]»: hoy se leen por número, así que borrar o
 * mover una fuente las desfasa. De ahí que solo se pueda quitar la última.
 */
export function citationsTo(
  sections: DocumentSection[],
  number: number,
  sourceCount: number,
): number {
  let count = 0;
  for (const section of sections) {
    for (const match of section.html.matchAll(CITATIONS)) {
      const groups = parseCite(match[1] ?? '', sourceCount);
      if (groups.some((g) => g.items.some((item) => item.number === number))) {
        count += 1;
      }
    }
  }
  return count;
}
