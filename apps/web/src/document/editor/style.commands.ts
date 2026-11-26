import type { Editor } from '@tiptap/core';

/** El estilo de un renglón: lo que es el texto donde está el cursor. */
export type BlockStyle =
  | 'text'
  | 'section'
  | 'group'
  | 'subtitle'
  | 'minor'
  | 'bullet'
  | 'ordered';

const HEADING_LEVELS = { group: 3, subtitle: 4, minor: 5 } as const;
const HEADING_STYLES: Record<number, BlockStyle> = {
  3: 'group',
  4: 'subtitle',
  5: 'minor',
};
const LISTS = { bulletList: 'bullet', orderedList: 'ordered' } as const;

/** El estilo donde está el cursor; en listas anidadas manda la más cercana. */
export function styleAt(editor: Editor): BlockStyle {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    const name = node.type.name;
    if (name === 'sectionTitle') return 'section';
    if (name === 'heading') {
      return HEADING_STYLES[node.attrs.level as number] ?? 'text';
    }
    if (name === 'bulletList' || name === 'orderedList') return LISTS[name];
  }
  return 'text';
}

/**
 * Deja el renglón con ese estilo. A diferencia de los botones de la barra, no alterna:
 * elegir el estilo que ya tiene no lo quita.
 */
export function applyStyle(editor: Editor, style: BlockStyle) {
  editor.commands.focus();
  if (styleAt(editor) === style) return;
  // Tiptap saca el renglón de la lista o del título en el que esté antes de cambiarlo.
  if (style === 'bullet') editor.commands.toggleBulletList();
  else if (style === 'ordered') editor.commands.toggleOrderedList();
  else if (style === 'text') editor.commands.setParagraph();
  else if (style === 'section') editor.commands.setNode('sectionTitle');
  else editor.commands.setHeading({ level: HEADING_LEVELS[style] });
}
