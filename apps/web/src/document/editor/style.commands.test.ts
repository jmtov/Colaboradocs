// @vitest-environment happy-dom

import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { editorExtensions } from './editor.extensions';
import { applyStyle, type BlockStyle, styleAt } from './style.commands';

const editors: Editor[] = [];
afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

const STYLES: BlockStyle[] = [
  'text',
  'section',
  'group',
  'subtitle',
  'minor',
  'bullet',
  'ordered',
];

/** Un documento con una sección y, en su cuerpo, el renglón «Objetivo» con el cursor. */
function withLine(body: string) {
  const editor = new Editor({
    extensions: editorExtensions,
    content: `<h2 data-section="s1" data-num="1" data-status="listo">Inicio</h2><p>Antes</p>${body}`,
  });
  editors.push(editor);
  let at = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === 'Objetivo') at = pos + 2;
  });
  editor.commands.setTextSelection(at);
  return editor;
}

const LINES: Record<Exclude<BlockStyle, 'section'>, string> = {
  text: '<p>Objetivo</p>',
  group: '<h3>Objetivo</h3>',
  subtitle: '<h4>Objetivo</h4>',
  minor: '<h5>Objetivo</h5>',
  bullet: '<ul><li><p>Objetivo</p></li></ul>',
  ordered: '<ol><li><p>Objetivo</p></li></ol>',
};

describe('styleAt', () => {
  it.each(Object.entries(LINES))('reconoce %s', (style, body) => {
    expect(styleAt(withLine(body))).toBe(style);
  });

  it('en listas anidadas manda la más cercana', () => {
    const editor = withLine(
      '<ul><li><p>Padre</p><ol><li><p>Objetivo</p></li></ol></li></ul>',
    );
    expect(styleAt(editor)).toBe('ordered');
  });
});

describe('applyStyle', () => {
  const cases = Object.entries(LINES).flatMap(([from, body]) =>
    STYLES.map((to) => [from, to, body] as const),
  );

  it.each(cases)('de %s a %s, sin perder el texto', (_from, to, body) => {
    const editor = withLine(body);
    applyStyle(editor, to);
    expect(styleAt(editor)).toBe(to);
    expect(editor.state.selection.$from.parent.textContent).toBe('Objetivo');
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it.each(STYLES)('de un título de sección (no el primero) a %s', (to) => {
    const editor = withLine(
      '<h2 data-section="s2" data-num="2" data-status="listo">Objetivo</h2><p>Cuerpo</p>',
    );
    expect(styleAt(editor)).toBe('section');
    applyStyle(editor, to);
    expect(styleAt(editor)).toBe(to);
    expect(editor.state.selection.$from.parent.textContent).toBe('Objetivo');
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it('sale de todas las listas anidadas', () => {
    const editor = withLine(
      '<ul><li><p>Padre</p><ul><li><p>Objetivo</p></li></ul></li></ul>',
    );
    applyStyle(editor, 'text');
    expect(styleAt(editor)).toBe('text');
  });

  it('el primer título de sección no deja de serlo: el documento empieza con una sección', () => {
    const editor = withLine(LINES.text);
    editor.commands.setTextSelection(2);
    applyStyle(editor, 'text');
    expect(editor.state.doc.firstChild?.type.name).toBe('sectionTitle');
    expect(editor.state.doc.firstChild?.textContent).toBe('Inicio');
  });
});
