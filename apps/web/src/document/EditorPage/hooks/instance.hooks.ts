import { useOverlay } from '@colaboradocs/review-ui';
import type { Editor } from '@tiptap/core';
import { createSignal } from 'solid-js';
import {
  applyLink,
  linkState,
  removeLink,
} from '@/document/editor/link.commands';
import { goToSection, sectionAt } from '@/document/editor/section.commands';
import LinkSheet from '../components/LinkSheet/LinkSheet';

/** El editor Tiptap del documento: la instancia, la sección del cursor y lo que se hace en el cursor. */
export function useEditorInstance() {
  const overlay = useOverlay();
  const [editor, setEditor] = createSignal<Editor>();
  // La sección donde está el cursor (de ahí sale el panel de la sección actual).
  const [currentId, setCurrentId] = createSignal<string>();

  /** El editor del documento está listo: sigue al cursor para saber en qué sección está. */
  function ready(instance: Editor) {
    setEditor(instance);
    setCurrentId(sectionAt(instance));
    instance.on('transaction', () => setCurrentId(sectionAt(instance)));
  }

  function goTo(id: string) {
    const instance = editor();
    if (instance) goToSection(instance, id);
  }

  /** Poner, cambiar o quitar el enlace del cursor o de la selección. */
  async function link() {
    const instance = editor();
    if (!instance) return;
    const result = await overlay.sheet(LinkSheet, {
      state: linkState(instance),
    });
    if (!result) return;
    if ('remove' in result) removeLink(instance);
    else applyLink(instance, result.url, result.text);
  }

  return { editor, ready, currentId, goTo, link };
}

export type EditorInstance = ReturnType<typeof useEditorInstance>;
