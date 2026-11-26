import { type Editor, getMarkRange } from '@tiptap/core';
import { selectedText } from './selection.utils';

/** El enlace donde está el cursor o la selección, para abrir la hoja con sus datos. */
export type LinkState = {
  /** Hay un enlace en el cursor (se edita) o no (se crea). */
  active: boolean;
  href: string;
  /** El texto del enlace, o el seleccionado; vacío si no hay ninguno. */
  text: string;
  /** Hay texto seleccionado (o el cursor está en un enlace). */
  hasSelection: boolean;
  /** La selección toma varios renglones: se enlaza como está, sin cambiar su texto. */
  multiline: boolean;
};

export function linkState(editor: Editor): LinkState {
  const { from, to, empty, $from, $to } = editor.state.selection;
  const active = editor.isActive('link');
  const href = active ? String(editor.getAttributes('link').href ?? '') : '';
  const mark = editor.schema.marks.link;
  const range = active && mark ? getMarkRange($from, mark) : undefined;
  const text = range
    ? editor.state.doc.textBetween(range.from, range.to, ' ')
    : (selectedText(editor)?.text ??
      editor.state.doc.textBetween(from, to, ' '));
  return {
    active,
    href,
    text,
    hasSelection: !empty || active,
    multiline: !$from.sameParent($to),
  };
}

/**
 * Pone o cambia el enlace, sobre lo seleccionado o en el cursor. El texto solo se
 * reescribe si cambió: así lo seleccionado conserva su formato.
 */
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
  const linked = (label: string) => ({
    type: 'text',
    text: label,
    marks: [{ type: 'link', attrs: { href: url } }],
  });
  if (state.multiline) return chain.setLink({ href: url }).run();
  const selected = selectedText(editor);
  if (!selected) return chain.insertContent(linked(text || url)).run();
  if (text && text !== selected.text) {
    return chain.insertContentAt(selected, linked(text)).run();
  }
  return chain.setTextSelection(selected).setLink({ href: url }).run();
}

/** Quita el enlace del cursor y deja su texto. */
export function removeLink(editor: Editor): boolean {
  return editor.chain().focus().extendMarkRange('link').unsetLink().run();
}
