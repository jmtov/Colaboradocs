import { type Editor, getMarkRange } from '@tiptap/core';

/** El enlace donde está el cursor o la selección, para abrir la hoja con sus datos. */
export type LinkState = {
  /** Hay un enlace en el cursor (se edita) o no (se crea). */
  active: boolean;
  href: string;
  /** El texto del enlace, o el seleccionado; vacío si no hay ninguno. */
  text: string;
  /** Hay texto seleccionado: no hace falta pedir cómo se lee. */
  hasSelection: boolean;
};

export function linkState(editor: Editor): LinkState {
  const { from, to, empty, $from } = editor.state.selection;
  const active = editor.isActive('link');
  const href = active ? String(editor.getAttributes('link').href ?? '') : '';
  const mark = editor.schema.marks.link;
  const range = active && mark ? getMarkRange($from, mark) : undefined;
  const text = range
    ? editor.state.doc.textBetween(range.from, range.to, ' ')
    : editor.state.doc.textBetween(from, to, ' ');
  return { active, href, text, hasSelection: !empty || active };
}

/** Pone o cambia el enlace: sobre el texto seleccionado o, sin selección, con el texto dado. */
export function applyLink(editor: Editor, url: string, text: string): boolean {
  const state = linkState(editor);
  const chain = editor.chain().focus();
  if (state.active) {
    const extended = chain.extendMarkRange('link');
    if (text && text !== state.text) {
      return extended
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: { href: url } }],
        })
        .run();
    }
    return extended.setLink({ href: url }).run();
  }
  if (state.hasSelection) return chain.setLink({ href: url }).run();
  return chain
    .insertContent({
      type: 'text',
      text: text || url,
      marks: [{ type: 'link', attrs: { href: url } }],
    })
    .run();
}

/** Quita el enlace del cursor y deja su texto. */
export function removeLink(editor: Editor): boolean {
  return editor.chain().focus().extendMarkRange('link').unsetLink().run();
}
