import { Editor } from '@tiptap/core';
import { htmlToSections, sectionsToHtml } from './document.convert';
import { editorExtensions } from './editor.extensions';

/** HTML de una sección → lo que el editor lo devuelve tras abrirlo y guardarlo. */
export function roundTrip(html: string): string {
  const editor = new Editor({
    extensions: editorExtensions,
    content: sectionsToHtml([
      { id: 'x', num: '1', title: 'T', status: 'listo', html },
    ]),
  });
  const out = htmlToSections(editor.getHTML())[0]?.html ?? '';
  editor.destroy();
  return out;
}
