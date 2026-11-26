import type { Editor } from '@tiptap/core';

export type SelectedText = { from: number; to: number; text: string };

/**
 * El texto seleccionado dentro de un solo renglón, sin los espacios de los bordes (al
 * seleccionar una palabra suelen colarse). `null` si no hay selección o toma varios
 * renglones: ese texto no se puede reemplazar por uno solo sin juntarlos.
 */
export function selectedText(editor: Editor): SelectedText | null {
  const { from, to, $from, $to } = editor.state.selection;
  if (!$from.sameParent($to)) return null;
  const raw = editor.state.doc.textBetween(from, to);
  const text = raw.trim();
  if (!text) return null;
  const start = from + (raw.length - raw.trimStart().length);
  return { from: start, to: start + text.length, text };
}
