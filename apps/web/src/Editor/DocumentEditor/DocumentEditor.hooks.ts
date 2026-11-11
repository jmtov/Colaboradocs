import { Editor } from '@tiptap/core';
import { onCleanup, onMount } from 'solid-js';
import { htmlToSections, sectionsToHtml } from '../document.convert';
import { createExtensions } from '../editor.extensions';
import type { DocumentEditorProps } from './DocumentEditor.types';

/**
 * Monta Tiptap en un elemento. No hay wrapper oficial para Solid: se crea el
 * `Editor` al montar y se destruye al salir. `props` se lee una sola vez para
 * el contenido; los cambios posteriores del padre no pisan lo que se escribe.
 */
export function useDocumentEditor(props: DocumentEditorProps) {
  let element!: HTMLDivElement;
  let editor: Editor | undefined;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: createExtensions({ onSettings: props.onSettings }),
      content: sectionsToHtml(props.sections),
      onUpdate: ({ editor: current }) =>
        props.onChange(htmlToSections(current.getHTML())),
    });
    props.onReady?.(editor);
  });

  onCleanup(() => editor?.destroy());

  return {
    setElement: (value: HTMLDivElement) => {
      element = value;
    },
  };
}
