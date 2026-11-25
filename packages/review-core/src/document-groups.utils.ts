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
function kindOf(item: DocumentListItem): DocumentKind {
  return DOCUMENT_KINDS.includes(item.tipo) ? item.tipo : 'otro';
}

export type DocumentGroup = {
  kind: DocumentKind;
  title: string;
  items: DocumentListItem[];
};

/**
 * Los documentos de la home repartidos por tipo (sin grupos vacíos). Las iniciativas van
 * por título; el resto, por fecha (`updated`) con la más reciente primero (a igual fecha, el orden en que llegan, que ya viene por título). Si todos son
 * del mismo tipo, la home no necesita encabezados: `titled` lo dice.
 */
export function groupDocuments(items: DocumentListItem[]): {
  groups: DocumentGroup[];
  titled: boolean;
} {
  const groups = KIND_GROUPS.map(({ kind, title }) => ({
    kind,
    title,
    items: items
      .filter((item) => kindOf(item) === kind)
      .sort((a, b) =>
        kind === 'iniciativa'
          ? a.title.localeCompare(b.title, 'es')
          : b.updated.localeCompare(a.updated),
      ),
  })).filter((group) => group.items.length > 0);
  return { groups, titled: groups.length > 1 };
}
