import { Editor } from '@tiptap/core';
import { editorExtensions } from './editor.extensions';

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

/** HTML de una sección → lo que el editor lo devuelve tras abrirlo y guardarlo. */
export function roundTrip(html: string): string {
  const editor = new Editor({ extensions: editorExtensions, content: html });
  const out = flattenListParagraphs(editor.getHTML());
  editor.destroy();
  return out;
}
