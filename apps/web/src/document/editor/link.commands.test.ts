// @vitest-environment happy-dom
import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { editorExtensions } from './editor.extensions';
import { roundTrip } from './editor.html';
import { applyLink, linkState, removeLink } from './link.commands';

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

const body = (instance: Editor) =>
  instance.getHTML().replace(/^<h2[^>]*>.*?<\/h2>/, '');

describe('enlaces en el editor', () => {
  it('un enlace sobrevive abrir y guardar, solo con su href', () => {
    expect(roundTrip('<p>Mira <a href="https://a.co/x">esto</a> hoy</p>')).toBe(
      '<p>Mira <a href="https://a.co/x">esto</a> hoy</p>',
    );
  });

  it('un enlace peligroso al abrir queda como texto', () => {
    expect(roundTrip('<p><a href="javascript:x">x</a></p>')).toBe('<p>x</p>');
  });

  it('sin selección inserta el texto con el enlace', () => {
    const instance = open('<p>Hola </p>');
    instance.commands.focus('end');
    applyLink(instance, 'https://a.co', 'la página');
    expect(body(instance)).toContain('<a href="https://a.co">la página</a>');
  });

  it('con texto seleccionado lo convierte en enlace', () => {
    const instance = open('<p>Mira esto</p>');
    instance.commands.setTextSelection({ from: 9, to: 13 });
    expect(linkState(instance).hasSelection).toBe(true);
    applyLink(instance, 'https://a.co', '');
    expect(body(instance)).toContain('Mira <a href="https://a.co">esto</a>');
  });

  it('editar y quitar un enlace existente', () => {
    const instance = open('<p>Mira <a href="https://a.co">esto</a></p>');
    instance.commands.setTextSelection(11);
    const state = linkState(instance);
    expect(state).toMatchObject({
      active: true,
      href: 'https://a.co',
      text: 'esto',
    });
    applyLink(instance, 'https://b.co', 'esto');
    expect(body(instance)).toContain('<a href="https://b.co">esto</a>');
    removeLink(instance);
    expect(body(instance)).not.toContain('<a');
    expect(body(instance)).toContain('Mira esto');
  });
});
