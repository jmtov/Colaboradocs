/**
 * Enlaces automáticos del glosario: `glossaryTerms` dice cómo aparece una
 * palabra en el texto (en minúsculas) y a qué término del glosario lleva. El
 * término es el texto de un `<dt>` de la sección `glosario`.
 */

export type GlossaryLinks = Record<string, string>;

/** Los términos del glosario (texto de cada `<dt>`), en orden y sin repetir. */
export function readTerms(html: string): string[] {
  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    'text/html',
  );
  const terms: string[] = [];
  for (const element of parsed.body.querySelectorAll('dt')) {
    const term = (element.textContent ?? '').trim();
    if (term && !terms.includes(term)) terms.push(term);
  }
  return terms;
}

/** «veeduría, Veedurías» → `['veeduría', 'veedurías']`: minúsculas, sin vacíos ni repetidos. */
export function parseForms(text: string): string[] {
  const forms: string[] = [];
  for (const piece of text.split(',')) {
    const form = piece.trim().toLowerCase();
    if (form && !forms.includes(form)) forms.push(form);
  }
  return forms;
}

/** Cómo aparece un término en el texto hoy. */
export function formsOf(links: GlossaryLinks, term: string): string[] {
  return Object.entries(links)
    .filter(([, value]) => value === term)
    .map(([form]) => form);
}

/** Reemplaza todas las formas de un término por las que dice `text`. */
export function withForms(
  links: GlossaryLinks,
  term: string,
  text: string,
): GlossaryLinks {
  const next: GlossaryLinks = {};
  for (const [form, value] of Object.entries(links)) {
    if (value !== term) next[form] = value;
  }
  for (const form of parseForms(text)) next[form] = term;
  return next;
}

/** Enlaces que apuntan a un término que ya no está en el glosario (se renombró o se borró). */
export function orphanLinks(
  links: GlossaryLinks,
  terms: string[],
): [string, string][] {
  return Object.entries(links).filter(([, value]) => !terms.includes(value));
}

export function withoutLink(links: GlossaryLinks, form: string): GlossaryLinks {
  return Object.fromEntries(
    Object.entries(links).filter(([key]) => key !== form),
  );
}

/** Mismos enlaces, sin importar el orden. */
export function sameLinks(a: GlossaryLinks, b: GlossaryLinks): boolean {
  const left = Object.entries(a).sort();
  const right = Object.entries(b).sort();
  return (
    left.length === right.length &&
    left.every(
      ([key, value], index) =>
        key === right[index]?.[0] && value === right[index]?.[1],
    )
  );
}
