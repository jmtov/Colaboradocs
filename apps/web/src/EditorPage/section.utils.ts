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

/** Un id de sección a partir del título: minúsculas, sin tildes, con guiones y distinto de los que ya hay. */
export function sectionIdFrom(title: string, taken: string[]): string {
  const base =
    title
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 56) || 'seccion';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

const isNumbered = (section: DocumentSection) => /^\d+$/.test(section.num);

/**
 * Una sección nueva y dónde va: después de la última numerada (antes de los
 * anexos), con el número siguiente. Se llama «Nueva sección» hasta que se renombre.
 */
export function newSection(sections: DocumentSection[]): {
  section: DocumentSection;
  index: number;
} {
  const numbers = sections.filter(isNumbered).map((s) => Number(s.num));
  const lastNumbered = sections.map(isNumbered).lastIndexOf(true);
  const title = 'Nueva sección';
  return {
    section: {
      id: sectionIdFrom(
        title,
        sections.map((s) => s.id),
      ),
      num: String(numbers.length > 0 ? Math.max(...numbers) + 1 : 1),
      title,
      status: 'borrador',
      html: '',
    },
    index: lastNumbered + 1,
  };
}

/** Un anexo nuevo (letra libre: A, B…) al final del documento. */
export function newAnnex(
  sections: DocumentSection[],
  id: string,
  title: string,
): DocumentSection {
  const used = sections.map((section) => section.num);
  const letter =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !used.includes(l)) ??
    'Z';
  return {
    id: sectionIdFrom(
      id,
      sections.map((section) => section.id),
    ),
    num: letter,
    title,
    status: 'borrador',
    html: '',
  };
}
