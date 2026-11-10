import { sanitizeSectionHtml } from '@juntanza/review-core';

export type ConvertOptions = { id: string; title?: string; version?: string };

export type RawSection = { title: string; html: string };

export type ConvertedDocument = {
  id: string;
  title: string;
  version: string;
  updated: string;
  sources: { label: string; url: string }[];
  sections: {
    id: string;
    num: string;
    title: string;
    status: 'borrador';
    html: string;
  }[];
  /** Cosas del original que no se pudieron conservar. */
  warnings: string[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Un id de sección válido: slug de hasta 60 caracteres. */
function sectionSlug(text: string): string {
  return slugify(text).slice(0, 60).replace(/-+$/g, '');
}

/** Arma el documento a partir de secciones ya separadas (de Markdown o de Word). */
export function buildDocument(
  title: string | undefined,
  sections: RawSection[],
  options: ConvertOptions,
  warnings: string[] = [],
): ConvertedDocument {
  const used = new Set<string>();
  return {
    id: options.id,
    title: options.title ?? title ?? options.id,
    version: options.version ?? '0.1',
    updated: new Date().toISOString().slice(0, 10),
    sources: [],
    sections: sections.map((section, index) => {
      const base = sectionSlug(section.title) || `seccion-${index + 1}`;
      let id = base;
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
      used.add(id);
      return {
        id,
        num: String(index + 1),
        title: section.title,
        status: 'borrador' as const,
        html: sanitizeSectionHtml(section.html).trim(),
      };
    }),
    warnings,
  };
}
