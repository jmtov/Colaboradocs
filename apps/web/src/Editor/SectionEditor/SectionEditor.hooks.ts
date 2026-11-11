import { Editor, type Extensions } from '@tiptap/core';
import { onCleanup, onMount } from 'solid-js';
import { editorExtensions } from '../editor.extensions';
import { flattenListParagraphs } from '../editor.html';
import type { SectionEditorProps } from './SectionEditor.types';

/**
 * Monta Tiptap en un elemento. No hay wrapper oficial para Solid: se crea el
 * `Editor` al montar y se destruye al salir. `props` se lee una sola vez para
 * el contenido; los cambios posteriores del padre no pisan lo que se escribe.
 */
export function useSectionEditor(
  props: SectionEditorProps,
  extensions: Extensions = editorExtensions,
) {
  let element!: HTMLDivElement;
  let editor: Editor | undefined;

  onMount(() => {
    editor = new Editor({
      element,
      extensions,
      content: props.html,
      onUpdate: ({ editor: current }) =>
        props.onChange(flattenListParagraphs(current.getHTML())),
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
