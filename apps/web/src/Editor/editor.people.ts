import { Extension } from '@tiptap/core';
import type { Node as ProseNode } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { findPeople } from '@/Prose/people.utils';

export type PersonRange = {
  from: number;
  to: number;
  /** Cómo está escrito en el texto, en minúsculas: la clave en `peopleTerms`. */
  key: string;
  /** El nombre registrado al que apunta. */
  name: string;
};

/** Dónde del documento hay nombres de personas (`people`: cómo se escribe -> nombre registrado). */
export function personRanges(
  doc: ProseNode,
  people: Record<string, string>,
): PersonRange[] {
  const ranges: PersonRange[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    // Dentro de un enlace el texto ya lleva a otra parte.
    if (node.marks.some((mark) => mark.type.name === 'link')) return;
    for (const match of findPeople(node.text, people)) {
      ranges.push({
        from: pos + match.start,
        to: pos + match.end,
        key: node.text.slice(match.start, match.end).toLowerCase(),
        name: match.name,
      });
    }
  });
  return ranges;
}

/**
 * Marca en el editor los nombres de personas del documento y deja tocarlos para
 * cambiar a quién apuntan o quitar la mención. La marca es solo de la pantalla
 * (decoración): no entra en el HTML guardado.
 */
export const PersonMarks = Extension.create({
  name: 'personMarks',
  addOptions: () => ({
    /** Las personas del documento, tal como están ahora (cambian al mencionar o quitar). */
    getPeople: undefined as (() => Record<string, string>) | undefined,
    /** Se llama al tocar un nombre, con su clave y el nombre registrado. */
    onEdit: undefined as ((key: string, name: string) => void) | undefined,
  }),
  addProseMirrorPlugins() {
    const { getPeople, onEdit } = this.options;
    if (!getPeople) return [];
    return [
      new Plugin({
        props: {
          decorations: ({ doc }) =>
            DecorationSet.create(
              doc,
              personRanges(doc, getPeople()).map((range) =>
                Decoration.inline(range.from, range.to, {
                  'data-person': range.name,
                  'data-person-key': range.key,
                }),
              ),
            ),
          handleDOMEvents: {
            click: (_view, event) => {
              const target = event.target;
              if (!(target instanceof Element) || !onEdit) return false;
              const mark = target.closest<HTMLElement>('[data-person]');
              if (!mark?.dataset.personKey) return false;
              onEdit(mark.dataset.personKey, mark.dataset.person ?? '');
              return true;
            },
          },
        },
      }),
    ];
  },
});
