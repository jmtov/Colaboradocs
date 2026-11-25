// @vitest-environment happy-dom
import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { editorExtensions } from './editor.extensions';
import { personRanges } from './editor.people';

let editor: Editor | undefined;

function open(html: string): Editor {
  editor = new Editor({
    extensions: editorExtensions,
    content: `<h2 data-id="x" data-status="listo">T</h2>${html}`,
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

const people = { 'ana lópez': 'Ana María López' };

describe('personRanges', () => {
  it('marca cada nombre del texto con su clave y su nombre registrado', () => {
    const instance = open('<p>Lleva Ana López y apoya ANA LÓPEZ.</p>');
    const ranges = personRanges(instance.state.doc, people);
    expect(ranges).toHaveLength(2);
    expect(ranges.map((r) => r.key)).toEqual(['ana lópez', 'ana lópez']);
    expect(ranges[0]?.name).toBe('Ana María López');
    expect(
      instance.state.doc.textBetween(ranges[0]?.from ?? 0, ranges[0]?.to ?? 0),
    ).toBe('Ana López');
  });

  it('no marca el nombre que está dentro de un enlace', () => {
    const instance = open('<p><a href="/x">Ana López</a> y Ana López</p>');
    expect(personRanges(instance.state.doc, people)).toHaveLength(1);
  });

  it('sin personas no marca nada', () => {
    const instance = open('<p>Ana López</p>');
    expect(personRanges(instance.state.doc, {})).toEqual([]);
  });
});
