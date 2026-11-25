// @vitest-environment happy-dom

import { Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { sectionsToHtml } from './document.convert';
import { editorExtensions } from './editor.extensions';
import { roundTrip } from './editor.html';

/** Los nodos en línea del primer párrafo, tal como los ve el editor. */
function firstParagraphContent(editor: Editor): JSONContent[] {
  const paragraph: JSONContent | undefined = editor.getJSON().content?.[1];
  return paragraph?.content ?? [];
}

describe('round-trip del editor', () => {
  it('párrafos, énfasis, saltos y títulos', () => {
    const html =
      '<p><strong>Para qué sirve.</strong> Texto con <em>énfasis</em><br>y salto.</p><h3>Grupo</h3><h4>Sub</h4><h5>Subsub</h5>';
    expect(roundTrip(html)).toBe(html);
  });

  it('listas con viñetas planas', () => {
    const html =
      '<ul><li>Uno</li><li>Dos</li></ul><ol><li>A</li><li>B</li></ol>';
    expect(roundTrip(html)).toBe(html);
  });

  it('lista de definiciones (glosario)', () => {
    const html =
      '<dl><dt>Consenso</dt><dd>Acuerdo sin oposición.</dd><dt>Quórum</dt><dd>Mínimo de presentes.</dd></dl>';
    expect(roundTrip(html)).toBe(html);
  });

  it('la cita es un nodo propio (no cursiva) y se escribe igual', () => {
    const html = '<p>Dato. <em>[2, 3]</em> Y <em>énfasis</em>.</p>';
    expect(roundTrip(html)).toBe(html);
    const editor = new Editor({
      extensions: editorExtensions,
      content: sectionsToHtml([
        { id: 'x', num: '1', title: 'T', status: 'listo', html },
      ]),
    });
    const inline = firstParagraphContent(editor);
    const citation = inline.find((node) => node.type === 'citation');
    expect(citation).toBeDefined();
    expect(citation?.attrs).toEqual({ text: '[2, 3]' });
    const italic = inline.find((node) =>
      (node.marks ?? []).some((mark) => mark.type === 'italic'),
    );
    expect(italic?.text).toBe('énfasis');
    editor.destroy();
  });

  it('listas anidadas', () => {
    const html =
      '<ul><li>Uno<ul><li>Uno.a</li><li>Uno.b</li></ul></li><li>Dos</li></ul>';
    expect(roundTrip(html)).toBe(html);
  });
});
