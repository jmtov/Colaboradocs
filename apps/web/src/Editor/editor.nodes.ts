import { Node } from '@tiptap/core';

/**
 * Nodos propios del formato del documento (los que Tiptap no trae):
 * lista de definiciones (`dl/dt/dd`, el glosario) y la cita a una fuente
 * (`<em>[2, 3]</em>`).
 */

export const DefinitionList = Node.create({
  name: 'definitionList',
  group: 'block',
  content: '(definitionTerm | definitionDescription)+',
  parseHTML: () => [{ tag: 'dl' }],
  renderHTML: ({ HTMLAttributes }) => ['dl', HTMLAttributes, 0],
});

export const DefinitionTerm = Node.create({
  name: 'definitionTerm',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'dt' }],
  renderHTML: ({ HTMLAttributes }) => ['dt', HTMLAttributes, 0],
});

export const DefinitionDescription = Node.create({
  name: 'definitionDescription',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'dd' }],
  renderHTML: ({ HTMLAttributes }) => ['dd', HTMLAttributes, 0],
});

/**
 * Una cita como `[2, 3]` es un `<em>` que empieza con `[`. Se modela como un
 * nodo en línea indivisible (no como cursiva) para que el editor no la parta
 * ni la mezcle con el énfasis normal; `priority` hace que gane a `italic`.
 */
export const Citation = Node.create({
  name: 'citation',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ text: { default: '' } }),
  parseHTML: () => [
    {
      tag: 'em',
      priority: 100,
      getAttrs: (element) => {
        const text = element.textContent ?? '';
        return text.startsWith('[') ? { text } : false;
      },
    },
  ],
  renderHTML: ({ node }) => ['em', node.attrs.text],
});
