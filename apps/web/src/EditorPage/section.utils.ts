import type { DocumentSection } from '@/content/content.types';

const FIELDS = ['id', 'num', 'title', 'status', 'description', 'html'] as const;

/** Las dos listas dicen lo mismo (mismas secciones, mismo orden y mismo contenido). */
export function sameSections(
  a: DocumentSection[],
  b: DocumentSection[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((section, index) => {
    const other = b[index];
    return other !== undefined && FIELDS.every((f) => section[f] === other[f]);
  });
}

/** La sección que lleva el glosario (términos y definiciones). */
export const GLOSSARY_ID = 'glosario';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * El editor siempre ofrece la sección «Glosario» (un anexo, al final de las
 * secciones y antes de la bibliografía), aunque el documento no la tenga: así
 * hay dónde escribir términos sin un botón aparte. Vacía no se guarda
 * (`withoutEmptyGlossary`), así que un documento que no la usa no cambia.
 */
export function withGlossary(sections: DocumentSection[]): DocumentSection[] {
  if (sections.some((section) => section.id === GLOSSARY_ID)) return sections;
  const used = sections.map((section) => section.num);
  const letter = [...LETTERS].find((item) => !used.includes(item)) ?? 'Z';
  return [
    ...sections,
    {
      id: GLOSSARY_ID,
      num: letter,
      title: 'Glosario',
      status: 'borrador',
      html: '',
    },
  ];
}

/** Lo que se guarda: las secciones sin el glosario si está vacío. */
export function withoutEmptyGlossary(
  sections: DocumentSection[],
): DocumentSection[] {
  return sections.filter(
    (section) => section.id !== GLOSSARY_ID || section.html.trim() !== '',
  );
}
