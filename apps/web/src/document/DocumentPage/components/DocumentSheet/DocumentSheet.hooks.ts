import type { DocumentContent } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createMemo } from 'solid-js';
import { sectionKicker } from '@/document/content/content.utils';
import { citeKey, parseCite } from '@/document/prose/cite.utils';
import { flashGlossaryTerm, scrollToId } from './outline.utils';
import type { SheetState } from './sheet.types';

type Options = {
  state: () => SheetState;
  content: () => DocumentContent;
  glossary: () => Map<string, string>;
  close: () => void;
};

/** Estado y acciones de la hoja inferior del documento. */
export function useDocumentSheet(options: Options) {
  const review = useReview();
  const kind = () => options.state().kind;

  /** La persona de la tarjeta: si está registrada, con su municipio. */
  const person = createMemo(() => {
    const sheet = options.state();
    if (sheet.kind !== 'person') return null;
    const registered = Object.values(review.snapshot()?.reviewers ?? {}).find(
      (item) => item.name === sheet.name,
    );
    return { name: sheet.name, municipality: registered?.municipality ?? null };
  });

  const section = createMemo(() => {
    const sheet = options.state();
    if (sheet.kind !== 'section') return null;
    return (
      options
        .content()
        .sections.find((item) => item.num === sheet.sectionNumber) ?? null
    );
  });
  const cite = createMemo(() => {
    const sheet = options.state();
    if (sheet.kind !== 'cite') return null;
    return {
      key: citeKey(sheet.text),
      groups: parseCite(sheet.text, options.content().sources.length),
    };
  });

  const termText = () => {
    const sheet = options.state();
    return sheet.kind === 'term'
      ? (options.glossary().get(sheet.label) ?? '')
      : '';
  };

  const kicker = () => {
    const sheet = options.state();
    switch (sheet.kind) {
      case 'contents':
        return 'Documento';
      case 'term':
        return 'Glosario';
      case 'person':
        return 'Persona';
      case 'cite':
        return (cite()?.groups.length ?? 0) > 0 ? 'Fuentes' : 'Nota';
      case 'section': {
        const found = section();
        return found ? sectionKicker(found) : '';
      }
    }
  };
  const title = () => {
    const sheet = options.state();
    switch (sheet.kind) {
      case 'contents':
        return 'Contenido';
      case 'term':
        return sheet.label;
      case 'person':
        return sheet.name;
      case 'cite':
        return `Nota [${cite()?.key ?? ''}]`;
      case 'section':
        return section()?.title ?? '';
    }
  };

  // Cierra la hoja y luego hace el efecto: el overlay la deja de pintar al instante
  // y la desmonta cuando acaba la salida.
  function closeThen(action: () => void) {
    options.close();
    action();
  }

  function pickOutlineItem(id: string) {
    closeThen(() => scrollToId(id));
  }

  function openGlossaryTerm() {
    const sheet = options.state();
    if (sheet.kind === 'term') {
      closeThen(() => flashGlossaryTerm(sheet.label));
    }
  }

  function openSources() {
    closeThen(() => scrollToId('fuentes'));
  }

  function goToSection(sectionId: string) {
    closeThen(() => scrollToId(`sec-${sectionId}`));
  }

  return {
    kind,
    kicker,
    title,
    section,
    cite,
    person,
    termText,
    pickOutlineItem,
    openGlossaryTerm,
    openSources,
    goToSection,
  };
}
