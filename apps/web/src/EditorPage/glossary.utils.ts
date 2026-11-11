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

export type GlossaryEntry = {
  term: string;
  /** La definición en texto plano. */
  definition: string;
  /** El HTML de cada `<dd>`, para no perder el formato de lo que no se edita. */
  defs: string[];
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Los términos del glosario y lo que la sección tiene aparte de las listas (que no se edita aquí). */
export function parseGlossary(html: string): {
  rest: string;
  entries: GlossaryEntry[];
} {
  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    'text/html',
  );
  let rest = '';
  const entries: GlossaryEntry[] = [];
  for (const child of parsed.body.children) {
    if (child.tagName !== 'DL') {
      rest += child.outerHTML;
      continue;
    }
    for (const item of child.children) {
      const last = entries[entries.length - 1];
      if (item.tagName === 'DT' || !last) {
        entries.push({
          term: (item.textContent ?? '').trim(),
          definition: '',
          defs: [],
        });
      } else {
        last.defs.push(item.innerHTML);
        last.definition = `${last.definition} ${item.textContent ?? ''}`.trim();
      }
    }
  }
  return { rest, entries };
}

/** El HTML de la sección: lo que no son términos y la lista. Sin términos, no hay lista. */
export function buildGlossary(rest: string, entries: GlossaryEntry[]): string {
  if (entries.length === 0) return rest;
  const items = entries
    .map(
      (entry) =>
        `<dt>${escapeHtml(entry.term)}</dt>${entry.defs.map((def) => `<dd>${def}</dd>`).join('')}`,
    )
    .join('');
  return `${rest}<dl>${items}</dl>`;
}

/** Una definición escrita a mano, como el HTML de un `<dd>`. */
export const plainDefinition = escapeHtml;
