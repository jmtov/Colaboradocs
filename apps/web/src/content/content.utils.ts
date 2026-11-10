import type { DocumentContent, DocumentSection } from './content.types';

/** Número de viñetas bajo «Pendientes…» en una sección. */
export function countPending(section: DocumentSection): number {
  const parsed = new DOMParser().parseFromString(
    `<body>${section.html}</body>`,
    'text/html',
  );
  let total = 0;
  for (const heading of parsed.body.querySelectorAll('h3')) {
    if (!(heading.textContent ?? '').startsWith('Pendientes')) continue;
    const next = heading.nextElementSibling;
    if (next && next.tagName === 'UL')
      total += next.querySelectorAll('li').length;
  }
  return total;
}

/** Término del glosario -> su definición en texto plano. */
export function readGlossary(content: DocumentContent): Map<string, string> {
  const glossary = new Map<string, string>();
  const section = content.sections.find((item) => item.id === 'glosario');
  if (!section) return glossary;
  const parsed = new DOMParser().parseFromString(
    `<body>${section.html}</body>`,
    'text/html',
  );
  for (const term of parsed.body.querySelectorAll('dt')) {
    const definition = term.nextElementSibling;
    if (definition && definition.tagName === 'DD') {
      glossary.set(
        (term.textContent ?? '').trim(),
        definition.textContent ?? '',
      );
    }
  }
  return glossary;
}

export function sectionLabel(section: DocumentSection): string {
  return `${section.num}. ${section.title}`;
}

/** "Sección 3" o "Anexo A", según el número. */
export function sectionKicker(section: DocumentSection): string {
  return /\d/.test(section.num)
    ? `Sección ${section.num}`
    : `Anexo ${section.num}`;
}
