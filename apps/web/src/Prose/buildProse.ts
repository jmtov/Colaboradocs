import { assignBlockIds } from '@juntanza/review-core';
import { findLinks } from './linkify.utils';
import styles from './Prose.module.css';

export type ProseOptions = {
  sectionId: string;
  /**
   * Contenido principal de la página: bloques revisables, enlaces a glosario y
   * citas, e ids para el índice. Apagado, es solo lectura (hojas inferiores).
   */
  reviewable: boolean;
  /** Términos del glosario a enlazar: cómo se escribe -> entrada. */
  glossaryTerms?: Record<string, string>;
};

type Context = {
  options: ProseOptions;
  blocks: { element: HTMLElement; text: string }[];
};

const NOTE_PREFIX = 'Para qué sirve';

function isNote(element: Element): boolean {
  const first = element.firstElementChild;
  if (!first || first.tagName !== 'STRONG') return false;
  return (first.textContent ?? '').startsWith(NOTE_PREFIX);
}

/** 2 para un título de grupo (h3), 3 para el de un eje o bloque (h4), 0 si no entra al índice. */
function outlineLevel(source: Element): 0 | 2 | 3 {
  if (source.tagName === 'H3') return 2;
  return source.tagName === 'H4' ? 3 : 0;
}

function create<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function convertChildren(source: Node, target: Node, context: Context) {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.nodeValue ?? ''));
    } else if (child instanceof Element) {
      target.appendChild(convertElement(child, context));
    }
  }
}

function registerBlock(
  element: HTMLElement,
  source: Element,
  context: Context,
) {
  if (!context.options.reviewable) return;
  context.blocks.push({ element, text: source.textContent ?? '' });
}

function convertElement(source: Element, context: Context): Node {
  const { reviewable } = context.options;

  switch (source.tagName) {
    case 'P': {
      const note = isNote(source);
      const className = note
        ? `${styles.paragraph} ${styles.note}`
        : styles.paragraph;
      const element = create('p', className);
      if (!note) registerBlock(element, source, context);
      convertChildren(source, element, context);
      return element;
    }
    case 'H3': {
      const element = create('h3', styles.heading);
      convertChildren(source, element, context);
      return element;
    }
    case 'H4': {
      const element = create('h4', styles.subheading);
      convertChildren(source, element, context);
      return element;
    }
    case 'H5': {
      const element = create('h5', styles.label);
      convertChildren(source, element, context);
      return element;
    }
    case 'UL':
    case 'OL': {
      const ordered = source.tagName === 'OL';
      const element = create(
        ordered ? 'ol' : 'ul',
        ordered ? styles.numbers : styles.bullets,
      );
      convertChildren(source, element, context);
      return element;
    }
    case 'LI': {
      const element = create('li', styles.item);
      registerBlock(element, source, context);
      convertChildren(source, element, context);
      return element;
    }
    case 'DL': {
      const element = create('dl', styles.definitions);
      convertChildren(source, element, context);
      return element;
    }
    case 'DT': {
      const element = create('dt', styles.defTerm);
      element.dataset.glossaryTerm = (source.textContent ?? '').trim();
      convertChildren(source, element, context);
      return element;
    }
    case 'DD': {
      const element = create('dd', styles.definition);
      registerBlock(element, source, context);
      convertChildren(source, element, context);
      return element;
    }
    case 'STRONG': {
      const element = create('strong', styles.strong);
      convertChildren(source, element, context);
      return element;
    }
    case 'EM': {
      const text = source.textContent ?? '';
      const isCite = text.startsWith('[');
      const element = create('em', isCite ? styles.cite : styles.emphasis);
      if (isCite && reviewable) {
        element.dataset.cite = text;
        element.dataset.interactive = '';
      }
      convertChildren(source, element, context);
      return element;
    }
    case 'BR':
      return create('br');
    default: {
      const fragment = document.createDocumentFragment();
      convertChildren(source, fragment, context);
      return fragment;
    }
  }
}

/** Enlaza términos del glosario y "sección N" dentro del texto corrido. */
function linkify(
  root: HTMLElement,
  sectionId: string,
  terms: Record<string, string>,
) {
  const seen = new Set<string>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest('h3, em')) continue;
    const text = node.nodeValue ?? '';
    const links = findLinks(
      text,
      seen,
      { linkTerms: sectionId !== 'glosario' },
      terms,
    );
    if (links.length === 0) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const link of links) {
      fragment.appendChild(
        document.createTextNode(text.slice(cursor, link.start)),
      );
      const span = create('span');
      span.textContent = text.slice(link.start, link.end);
      span.dataset.interactive = '';
      if (link.kind === 'term') {
        span.className = styles.glossaryLink ?? '';
        span.dataset.term = link.label;
      } else {
        span.className = styles.sectionRef ?? '';
        span.dataset.section = link.sectionNumber;
      }
      fragment.appendChild(span);
      cursor = link.end;
    }
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
}

/** Convierte el HTML limitado de una sección en DOM con clases, ids de bloque y enlaces. */
export function buildProse(html: string, options: ProseOptions): HTMLElement {
  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    'text/html',
  );
  const root = create('div', styles.prose);
  const context: Context = { options, blocks: [] };

  Array.from(parsed.body.children).forEach((source, index) => {
    const converted = convertElement(source, context);
    if (options.reviewable && converted instanceof HTMLElement) {
      const level = outlineLevel(source);
      if (level > 0) {
        converted.id = `${options.sectionId}--${index}`;
        converted.dataset.outlineLevel = String(level);
      }
    }
    root.appendChild(converted);
  });

  if (options.reviewable) {
    const ids = assignBlockIds(
      context.blocks.map((block) => ({
        sectionId: options.sectionId,
        text: block.text,
      })),
    );
    context.blocks.forEach((block, index) => {
      const id = ids[index];
      if (id) block.element.dataset.blockId = id;
    });
    linkify(root, options.sectionId, options.glossaryTerms ?? {});
  }
  return root;
}
