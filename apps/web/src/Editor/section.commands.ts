import type { Editor } from '@tiptap/core';
import type { Node as ProseNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import type { DocumentSection } from '@/content/content.types';
import { isNoteNode } from './editor.sections';

/** Lo que se puede cambiar de una sección sin tocar su texto. */
export type SectionAttrs = {
  status?: DocumentSection['status'];
  description?: string | null;
  annex?: boolean;
};

type Located = { id: string; pos: number; end: number; node: ProseNode };

/** Las secciones del documento del editor: dónde empieza cada título y dónde termina su cuerpo. */
export function locateSections(doc: ProseNode): Located[] {
  const found: Located[] = [];
  doc.forEach((node, offset) => {
    if (node.type.name === 'sectionTitle') {
      const previous = found[found.length - 1];
      if (previous) previous.end = offset;
      found.push({
        id: node.attrs.id as string,
        pos: offset,
        end: doc.content.size,
        node,
      });
    }
  });
  return found;
}

/** El id de la sección donde está el cursor (la del título que lo precede). */
export function sectionAt(editor: Editor): string | undefined {
  const head = editor.state.selection.head;
  const all = locateSections(editor.state.doc);
  return all.filter((item) => item.pos < head || item.pos === 0).pop()?.id;
}

/** Cambia el estado, la descripción o el anexo de una sección; el texto no se toca. */
export function updateSection(editor: Editor, id: string, attrs: SectionAttrs) {
  const target = locateSections(editor.state.doc).find(
    (item) => item.id === id,
  );
  if (!target) return;
  editor.view.dispatch(
    editor.state.tr.setNodeMarkup(target.pos, undefined, {
      ...target.node.attrs,
      ...attrs,
    }),
  );
}

/** Borra la sección entera (título y cuerpo). El documento no se queda sin secciones. */
export function removeSection(editor: Editor, id: string): boolean {
  const all = locateSections(editor.state.doc);
  const target = all.find((item) => item.id === id);
  if (!target || all.length < 2) return false;
  editor.view.dispatch(editor.state.tr.delete(target.pos, target.end));
  return true;
}

/** Lleva el cursor al final del título de una sección y la muestra. */
export function goToSection(editor: Editor, id: string) {
  const target = locateSections(editor.state.doc).find(
    (item) => item.id === id,
  );
  if (!target) return;
  const end = target.pos + target.node.nodeSize - 1;
  const { state } = editor;
  editor.view.dispatch(
    state.tr
      .setSelection(TextSelection.near(state.doc.resolve(end)))
      .scrollIntoView(),
  );
  editor.view.focus();
}

const NOTE_LABEL = 'Para qué sirve.';
const NOTE = [
  { type: 'text', marks: [{ type: 'bold' }], text: NOTE_LABEL },
  { type: 'text', text: ' ' },
];

/** ¿El cursor está en la nota «Para qué sirve» de una sección? */
export function inNote(editor: Editor): boolean {
  const { doc, selection } = editor.state;
  const { $from } = selection;
  if ($from.depth < 1) return false;
  const index = $from.index(0);
  return isNoteNode(
    doc.child(index),
    index > 0 ? doc.child(index - 1) : undefined,
  );
}

/**
 * Agrega el párrafo «Para qué sirve.» al inicio de la sección donde está el
 * cursor. Si la sección ya tiene nota, no agrega otra: lleva el cursor a ella.
 */
export function addNote(editor: Editor) {
  const id = sectionAt(editor);
  const target = locateSections(editor.state.doc).find(
    (item) => item.id === id,
  );
  if (!target) return;
  const at = target.pos + target.node.nodeSize;
  const existing = editor.state.doc.nodeAt(at);
  if (existing && isNoteNode(existing, target.node)) {
    editor
      .chain()
      .focus(at + existing.nodeSize - 1)
      .run();
    return;
  }
  editor
    .chain()
    .insertContentAt(at, { type: 'paragraph', content: NOTE })
    .focus(at + 1 + NOTE_LABEL.length + 1)
    .run();
}

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

/** Agrega un término con su definición al final de la lista de la sección actual (o crea la lista). */
export function addTerm(editor: Editor) {
  const id = sectionAt(editor);
  const target = locateSections(editor.state.doc).find(
    (item) => item.id === id,
  );
  if (!target) return;
  const last = editor.state.doc.resolve(target.end).nodeBefore;
  if (last?.type.name === 'definitionList') {
    editor
      .chain()
      .focus()
      .insertContentAt(target.end - 1, TERM_PAIR)
      .run();
    return;
  }
  editor
    .chain()
    .focus()
    .insertContentAt(target.end, { type: 'definitionList', content: TERM_PAIR })
    .run();
}

/** Inserta una cita («[2, 3]») donde está el cursor, a las fuentes con esos números (1 = la primera). */
export function insertCitation(editor: Editor, numbers: number[]): boolean {
  if (numbers.length === 0) return false;
  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'citation',
      attrs: { text: `[${numbers.join(', ')}]` },
    })
    .run();
}
