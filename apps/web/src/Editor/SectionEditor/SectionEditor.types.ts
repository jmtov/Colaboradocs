import type { Editor } from '@tiptap/core';

export type SectionEditorProps = {
  /** HTML inicial de la sección. Solo se lee al montar: el editor es el dueño del texto. */
  html: string;
  /** Cada cambio devuelve el HTML de la sección en el formato del documento. */
  onChange: (html: string) => void;
  /** Para quien necesite comandos (barra de herramientas, tests). */
  onReady?: (editor: Editor) => void;
};
