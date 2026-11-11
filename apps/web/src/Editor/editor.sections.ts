import { Extension, Node } from '@tiptap/core';
import type { Node as ProseNode } from '@tiptap/pm/model';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/** El ícono de ajustes (líneas con deslizadores), como el resto de los íconos de la página. */
const SETTINGS_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>';

/** Las ocho letras y números de un id nuevo: `s-1a2b3c4d`. Cumple el formato de id de sección. */
const newId = () => `s-${crypto.randomUUID().slice(0, 8)}`;

/**
 * El título de una sección (`<h2>`). Todo lo que sigue hasta el próximo título
 * es el cuerpo de esa sección. Lleva los datos de la sección que no son texto:
 * `id` (estable, es la base de los ids de bloque), `status`, `description` y
 * si es anexo. El número no se guarda: sale de la posición.
 */
export const SectionTitle = Node.create({
  name: 'sectionTitle',
  content: 'text*',
  marks: '',
  defining: true,

  addOptions: () => ({
    /** Se llama al tocar el botón de ajustes del título de una sección. */
    onSettings: undefined as ((id: string) => void) | undefined,
  }),

  addAttributes: () => ({
    id: {
      default: null,
      parseHTML: (element) => element.getAttribute('data-id'),
      renderHTML: (attrs) => (attrs.id ? { 'data-id': attrs.id } : {}),
    },
    status: {
      default: 'borrador',
      parseHTML: (element) => element.getAttribute('data-status') ?? 'borrador',
      renderHTML: (attrs) => ({ 'data-status': attrs.status }),
    },
    description: {
      default: null,
      parseHTML: (element) => element.getAttribute('data-description'),
      renderHTML: (attrs) =>
        attrs.description ? { 'data-description': attrs.description } : {},
    },
    annex: {
      default: false,
      parseHTML: (element) => element.hasAttribute('data-annex'),
      renderHTML: (attrs) => (attrs.annex ? { 'data-annex': '' } : {}),
    },
  }),

  parseHTML: () => [{ tag: 'h2' }],
  renderHTML: ({ HTMLAttributes }) => ['h2', HTMLAttributes, 0],

  addKeyboardShortcuts() {
    return {
      // Enter en el título lleva al cuerpo (no parte la sección ni la duplica).
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== 'sectionTitle') return false;
        const after = $from.after();
        return editor.commands.command(({ tr, dispatch }) => {
          if (!dispatch) return true;
          const next = tr.doc.nodeAt(after);
          if (!next || next.type.name === 'sectionTitle') {
            tr.insert(after, editor.schema.nodes.paragraph.create());
          }
          tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
          return true;
        });
      },
      // Backspace al inicio del título la une con la sección anterior (el título pasa a párrafo).
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (
          !selection.empty ||
          $from.parent.type.name !== 'sectionTitle' ||
          $from.parentOffset !== 0
        ) {
          return false;
        }
        // La primera sección no se puede unir con nada: el documento siempre empieza con un título.
        if ($from.before() === 0) return true;
        return editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            tr.setNodeMarkup($from.before(), editor.schema.nodes.paragraph);
          }
          return true;
        });
      },
    };
  },

  // Un título sin id (recién creado) o con uno repetido (pegado) recibe uno nuevo.
  addProseMirrorPlugins() {
    const { onSettings } = this.options;
    return [
      // Un botón al final de cada título abre los ajustes de la sección (estado, descripción, anexo).
      new Plugin({
        props: {
          decorations: ({ doc }) => {
            if (!onSettings) return DecorationSet.empty;
            const widgets: Decoration[] = [];
            doc.forEach((node, offset) => {
              if (node.type.name !== 'sectionTitle') return;
              const id = node.attrs.id as string | null;
              if (!id) return;
              widgets.push(
                Decoration.widget(
                  offset + node.nodeSize - 1,
                  () => {
                    // El tooltip es hermano del botón, no hijo: el botón recorta lo que sale de su marco.
                    const wrap = document.createElement('span');
                    wrap.setAttribute('data-settings-wrap', '');
                    wrap.contentEditable = 'false';
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.setAttribute('data-section-settings', id);
                    button.setAttribute('aria-label', 'Ajustes de la sección');
                    button.innerHTML = SETTINGS_ICON;
                    button.addEventListener('click', () => onSettings(id));
                    const tip = document.createElement('span');
                    tip.setAttribute('data-settings-tip', '');
                    tip.setAttribute('aria-hidden', 'true');
                    tip.textContent = 'Ajustes de la sección';
                    wrap.append(button, tip);
                    return wrap;
                  },
                  { side: 1, key: `settings-${id}`, stopEvent: () => true },
                ),
              );
            });
            return DecorationSet.create(doc, widgets);
          },
        },
      }),
      new Plugin({
        appendTransaction: (_transactions, _old, state) => {
          const seen = new Set<string>();
          const fix: { pos: number; attrs: Record<string, unknown> }[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'sectionTitle') return;
            const id = node.attrs.id as string | null;
            if (id && !seen.has(id)) seen.add(id);
            else fix.push({ pos, attrs: node.attrs });
          });
          if (fix.length === 0) return null;
          const tr = state.tr;
          for (const { pos, attrs } of fix) {
            let id = newId();
            while (seen.has(id)) id = newId();
            seen.add(id);
            tr.setNodeMarkup(pos, undefined, { ...attrs, id });
          }
          return tr;
        },
      }),
    ];
  },
});

/** La nota «Para qué sirve» es el párrafo que sigue al título y empieza con eso en negrilla. */
const NOTE_PREFIX = 'Para qué sirve';

/** ¿Es `node` la nota de su sección? `previous` es el bloque que lo precede en el documento. */
export function isNoteNode(
  node: ProseNode,
  previous: ProseNode | undefined,
): boolean {
  const first = node.firstChild;
  return (
    node.type.name === 'paragraph' &&
    previous?.type.name === 'sectionTitle' &&
    first?.marks.some((mark) => mark.type.name === 'bold') === true &&
    node.textContent.startsWith(NOTE_PREFIX)
  );
}

/** Marca esa nota (`data-note`) para que se vea apagada, como en el documento publicado. */
export const NoteStyle = Extension.create({
  name: 'noteStyle',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc }) => {
            const decorations: Decoration[] = [];
            doc.forEach((node, offset, index) => {
              const previous = index > 0 ? doc.child(index - 1) : undefined;
              if (isNoteNode(node, previous)) {
                decorations.push(
                  Decoration.node(offset, offset + node.nodeSize, {
                    'data-note': '',
                  }),
                );
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
