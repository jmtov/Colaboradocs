import type { Editor } from '@tiptap/core';
import type { DocumentSection } from '@/content/content.types';

export type DocumentEditorProps = {
  /** Las secciones al abrir. Solo se leen al montar: el editor es el dueño del texto. */
  sections: DocumentSection[];
  /** Cada cambio entrega todas las secciones en el formato del documento. */
  onChange: (sections: DocumentSection[]) => void;
  /** Se llama con el id de la sección cuyo botón de ajustes se tocó. */
  onSettings?: (id: string) => void;
  /** Para quien necesite comandos (barra de herramientas, panel, tests). */
  onReady?: (editor: Editor) => void;
};
