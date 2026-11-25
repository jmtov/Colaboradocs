import type { DocumentContent, DocumentKind } from '@colaboradocs/review-core';

/** El documento más chico que la página acepta: una sección con un párrafo para empezar a escribir. */
export function blankDocument(
  id: string,
  title: string,
  updated: string,
  type: DocumentKind = 'other',
): DocumentContent {
  return {
    id,
    title,
    // «other» es lo de siempre: no se escribe.
    ...(type !== 'other' ? { type } : {}),
    version: '0.1',
    updated,
    sources: [],
    sections: [
      {
        id: 'primera-seccion',
        num: '1',
        title: 'Primera sección',
        status: 'borrador',
        html: '<p>Escribe aquí.</p>',
      },
    ],
  };
}
