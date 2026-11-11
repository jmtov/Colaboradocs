import type { ChainedCommands, Editor } from '@tiptap/core';

export type ToolbarItem = {
  label: string;
  /** Texto que lee el lector de pantalla y el tooltip. */
  title: string;
  /** Nodo o marca del editor que dice si está activo. */
  name?: string;
  attrs?: Record<string, unknown>;
  run: (chain: ChainedCommands) => ChainedCommands;
  /** Para lo que necesita mirar el documento: va en lugar de `run`. */
  command?: (editor: Editor) => void;
};

export type ToolbarVariant = 'section' | 'note' | 'glossary';

export const FORMAT_ITEMS: ToolbarItem[] = [
  {
    label: 'Negrilla',
    title: 'Negrilla (Cmd/Ctrl+B)',
    name: 'bold',
    run: (chain) => chain.toggleBold(),
  },
  {
    label: 'Cursiva',
    title: 'Cursiva (Cmd/Ctrl+I)',
    name: 'italic',
    run: (chain) => chain.toggleItalic(),
  },
  {
    label: 'Encabezado 1',
    title: 'Título de grupo',
    name: 'heading',
    attrs: { level: 3 },
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  {
    label: 'Encabezado 2',
    title: 'Subtítulo',
    name: 'heading',
    attrs: { level: 4 },
    run: (chain) => chain.toggleHeading({ level: 4 }),
  },
  {
    label: 'Encabezado 3',
    title: 'Título menor',
    name: 'heading',
    attrs: { level: 5 },
    run: (chain) => chain.toggleHeading({ level: 5 }),
  },
  {
    label: 'Lista numerada',
    title: 'Lista numerada',
    name: 'orderedList',
    run: (chain) => chain.toggleOrderedList(),
  },
  {
    label: 'Lista',
    title: 'Lista con viñetas',
    name: 'bulletList',
    run: (chain) => chain.toggleBulletList(),
  },
];

const [BOLD, ITALIC] = FORMAT_ITEMS as [ToolbarItem, ToolbarItem];

const TERM_PAIR = [
  {
    type: 'definitionTerm',
    content: [{ type: 'text', text: 'Nuevo término' }],
  },
  {
    type: 'definitionDescription',
    content: [{ type: 'text', text: 'Definición' }],
  },
];

/** Agrega un término con su definición al final de la lista (o crea la lista). */
export function addTerm(editor: Editor) {
  if (editor.state.doc.lastChild?.type.name === 'definitionList') {
    editor
      .chain()
      .focus()
      .insertContentAt(editor.state.doc.content.size - 1, TERM_PAIR)
      .run();
    return;
  }
  editor.commands.setContent(
    { type: 'doc', content: [{ type: 'definitionList', content: TERM_PAIR }] },
    { emitUpdate: true },
  );
}

const GLOSSARY_ITEMS: ToolbarItem[] = [
  {
    label: 'Término',
    title: 'Este renglón es un término',
    name: 'definitionTerm',
    run: (chain) => chain.setNode('definitionTerm'),
  },
  {
    label: 'Definición',
    title: 'Este renglón es la definición',
    name: 'definitionDescription',
    run: (chain) => chain.setNode('definitionDescription'),
  },
  {
    label: '+ Término',
    title: 'Agregar un término al final',
    run: (chain) => chain,
    command: addTerm,
  },
];

/** Qué botones lleva cada barra: el cuerpo, la nota (solo énfasis) o el glosario. */
export const ITEMS_BY_VARIANT: Record<ToolbarVariant, ToolbarItem[]> = {
  section: FORMAT_ITEMS,
  note: [BOLD, ITALIC],
  glossary: [BOLD, ITALIC, ...GLOSSARY_ITEMS],
};
