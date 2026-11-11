import type { DocumentSection } from '@/content/content.types';

const PLAIN_PARAGRAPH = '((?:(?!</?p>)[\\s\\S])*)';

/**
 * Tiptap pone cada viñeta como `<li><p>…</p></li>`; el formato del documento
 * es `<li>…</li>`. Se quita el párrafo cuando es el único texto de la viñeta
 * (con o sin una lista anidada después).
 */
export function flattenListParagraphs(html: string): string {
  return html
    .replace(
      new RegExp(`<li><p>${PLAIN_PARAGRAPH}</p></li>`, 'g'),
      '<li>$1</li>',
    )
    .replace(
      new RegExp(`<li><p>${PLAIN_PARAGRAPH}</p>(?=<[uo]l>)`, 'g'),
      '<li>$1',
    );
}

const STATUSES = ['listo', 'borrador', 'pendiente'] as const;

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isAnnex = (section: DocumentSection) => !/^\d+$/.test(section.num);

/**
 * Las secciones como un solo HTML para el editor: cada sección empieza con su
 * título (`<h2>` con los datos que no son texto) y sigue con su contenido.
 */
export function sectionsToHtml(sections: DocumentSection[]): string {
  return sections
    .map((section) => {
      const attrs = [
        `data-id="${escapeAttr(section.id)}"`,
        `data-status="${section.status}"`,
        section.description
          ? `data-description="${escapeAttr(section.description)}"`
          : '',
        isAnnex(section) ? 'data-annex' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<h2 ${attrs}>${escapeAttr(section.title)}</h2>${section.html || '<p></p>'}`;
    })
    .join('');
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Lo contrario: el HTML del editor se parte en secciones por cada título. El
 * número sale de la posición (1, 2, 3… y A, B… para los anexos); los párrafos
 * vacíos no se guardan.
 */
export function htmlToSections(html: string): DocumentSection[] {
  const template = document.createElement('template');
  template.innerHTML = flattenListParagraphs(html);
  const sections: DocumentSection[] = [];
  let numbered = 0;
  let annexes = 0;
  for (const element of template.content.children) {
    if (element.tagName === 'H2') {
      const annex = element.hasAttribute('data-annex');
      const status = element.getAttribute('data-status');
      const description = element.getAttribute('data-description');
      if (annex) annexes += 1;
      else numbered += 1;
      const num = annex ? (LETTERS[annexes - 1] ?? 'Z') : String(numbered);
      sections.push({
        id: element.getAttribute('data-id') ?? '',
        num,
        title: element.textContent ?? '',
        status: STATUSES.find((value) => value === status) ?? 'borrador',
        ...(description ? { description } : {}),
        html: '',
      });
    } else if (element.outerHTML !== '<p></p>') {
      const current = sections[sections.length - 1];
      if (current) current.html += element.outerHTML;
    }
  }
  return sections;
}
