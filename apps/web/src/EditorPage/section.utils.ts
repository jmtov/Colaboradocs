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

/** El glosario fuera del editor: su HTML y lo que la sección tenía aparte del texto. */
export type GlossaryState = {
  html: string;
  /** Título, estado y demás de la sección, si el documento ya la tenía. */
  meta?: Omit<DocumentSection, 'id' | 'html'>;
  /** Dónde estaba entre las secciones, para guardarla en el mismo lugar. */
  at: number;
};

/** Separa la sección glosario del resto: el editor solo lleva las demás. */
export function splitGlossary(sections: DocumentSection[]): {
  main: DocumentSection[];
  glossary: GlossaryState;
} {
  const at = sections.findIndex((section) => section.id === GLOSSARY_ID);
  const found = sections[at];
  const main = sections.filter((section) => section.id !== GLOSSARY_ID);
  if (!found) return { main, glossary: { html: '', at: main.length } };
  const { id: _id, html, ...meta } = found;
  return { main, glossary: { html, meta, at } };
}

/**
 * Las secciones tal como se guardan: las del editor y, si tiene términos, el
 * glosario (un anexo: conserva su letra si está libre; si no, la primera libre).
 */
export function joinGlossary(
  main: DocumentSection[],
  glossary: GlossaryState,
): DocumentSection[] {
  if (glossary.html.trim() === '') return main;
  const used = main.map((section) => section.num);
  const keep = glossary.meta?.num;
  const num =
    keep && !used.includes(keep)
      ? keep
      : ([...LETTERS].find((item) => !used.includes(item)) ?? 'Z');
  const section: DocumentSection = {
    ...glossary.meta,
    id: GLOSSARY_ID,
    num,
    title: glossary.meta?.title ?? 'Glosario',
    status: glossary.meta?.status ?? 'borrador',
    html: glossary.html,
  };
  const list = [...main];
  list.splice(Math.min(glossary.at, list.length), 0, section);
  return list;
}
