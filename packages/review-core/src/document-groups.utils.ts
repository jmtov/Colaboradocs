import {
  DOCUMENT_KINDS,
  type DocumentKind,
  type DocumentListItem,
} from './document.types';

/** El orden de los grupos en la home y cómo se llama cada uno. */
export const KIND_GROUPS: {
  kind: DocumentKind;
  title: string;
  singular: string;
}[] = [
  { kind: 'iniciativa', title: 'Iniciativas', singular: 'Iniciativa' },
  { kind: 'acta', title: 'Actas', singular: 'Acta' },
  { kind: 'guia', title: 'Guías', singular: 'Guía' },
  { kind: 'otro', title: 'Otros documentos', singular: 'Documento' },
];

/** El tipo de un documento de la lista; sin tipo, o uno que no se conoce, es «otro». */
export function kindOf(item: DocumentListItem): DocumentKind {
  return DOCUMENT_KINDS.includes(item.tipo) ? item.tipo : 'otro';
}

/** La fecha del documento: la de elaboración (`date`) y, sin ella, la de su última versión (`updated`). */
export function documentDate(item: DocumentListItem): string {
  return item.date ?? item.updated;
}

/** Cómo se llama el tipo de un documento, en singular: «Iniciativa», «Acta», «Guía». */
export function kindLabel(item: DocumentListItem): string {
  return (
    KIND_GROUPS.find((group) => group.kind === kindOf(item))?.singular ??
    'Documento'
  );
}

/**
 * Los documentos de la home en un solo orden: por tipo (el de `KIND_GROUPS`); las iniciativas
 * por título y el resto por fecha del documento (`documentDate`), la más reciente primero.
 */
export function sortDocuments(items: DocumentListItem[]): DocumentListItem[] {
  const rank = (item: DocumentListItem) =>
    KIND_GROUPS.findIndex((group) => group.kind === kindOf(item));
  return [...items].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return kindOf(a) === 'iniciativa'
      ? a.title.localeCompare(b.title, 'es')
      : documentDate(b).localeCompare(documentDate(a));
  });
}

/** Cuántos documentos hay de cada tipo, en el orden de `KIND_GROUPS` y sin los tipos vacíos. */
export function countKinds(
  items: DocumentListItem[],
): { kind: DocumentKind; title: string; count: number }[] {
  return KIND_GROUPS.map(({ kind, title }) => ({
    kind,
    title,
    count: items.filter((item) => kindOf(item) === kind).length,
  })).filter((entry) => entry.count > 0);
}

/** Minúsculas y sin tildes, para que «guia» encuentre «Guía». */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Los documentos que cumplen el filtro: `kind` (si se da) y todas las palabras de `query`
 * en el título, la descripción, las personas o el nombre del tipo.
 */
export function filterDocuments(
  items: DocumentListItem[],
  filter: { query: string; kind: DocumentKind | null },
): DocumentListItem[] {
  const words = fold(filter.query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (filter.kind && kindOf(item) !== filter.kind) return false;
    if (words.length === 0) return true;
    const haystack = fold(
      [
        item.title,
        item.description,
        item.responsable,
        item.participantes,
        kindLabel(item),
      ]
        .filter(Boolean)
        .join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}

/** «Ana, Luis, Eva, Sol» → los primeros `max` nombres y cuántos quedan fuera. */
export function summarizePeople(
  people: string,
  max = 3,
): { shown: string[]; more: number } {
  const names = people
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return { shown: names.slice(0, max), more: Math.max(0, names.length - max) };
}
