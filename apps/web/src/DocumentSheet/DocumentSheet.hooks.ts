import { createMemo } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import { sectionKicker } from '@/content/content.utils';
import { citeKey, parseCite } from '@/Prose/cite.utils';
import { flashGlossaryTerm, scrollToId } from './outline.utils';
import type { SheetState } from './sheet.types';

type Options = {
  sheet: () => SheetState;
  content: () => DocumentContent;
  glossary: () => Map<string, string>;
  onClose: () => void;
};

/** Estado y acciones de la hoja inferior del documento. */
export function useDocumentSheet(options: Options) {
  const kind = () => options.sheet().kind;
  const open = () => kind() !== 'none';

  const section = createMemo(() => {
    const sheet = options.sheet();
    if (sheet.kind !== 'section') return null;
    return (
      options
        .content()
        .sections.find((item) => item.num === sheet.sectionNumber) ?? null
    );
  });
  const cite = createMemo(() => {
    const sheet = options.sheet();
    if (sheet.kind !== 'cite') return null;
    return {
      key: citeKey(sheet.text),
      groups: parseCite(sheet.text, options.content().sources.length),
    };
  });

  const termText = () => {
    const sheet = options.sheet();
    return sheet.kind === 'term'
      ? (options.glossary().get(sheet.label) ?? '')
      : '';
  };

  const kicker = () => {
    const sheet = options.sheet();
    switch (sheet.kind) {
      case 'contents':
        return 'Documento';
      case 'term':
        return 'Glosario';
      case 'cite':
        return (cite()?.groups.length ?? 0) > 0 ? 'Fuentes' : 'Nota';
      case 'section': {
        const found = section();
        return found ? sectionKicker(found) : '';
      }
      default:
        return '';
    }
  };
  const title = () => {
    const sheet = options.sheet();
    switch (sheet.kind) {
      case 'contents':
        return 'Contenido';
      case 'term':
        return sheet.label;
      case 'cite':
        return `Nota [${cite()?.key ?? ''}]`;
      case 'section':
        return section()?.title ?? '';
      default:
        return '';
    }
  };

  function closeThen(action: () => void) {
    options.onClose();
    action();
  }

  function pickOutlineItem(id: string) {
    closeThen(() => scrollToId(id));
  }

  function openGlossaryTerm() {
    const sheet = options.sheet();
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
    open,
    kicker,
    title,
    section,
    cite,
    termText,
    pickOutlineItem,
    openGlossaryTerm,
    openSources,
    goToSection,
  };
}
