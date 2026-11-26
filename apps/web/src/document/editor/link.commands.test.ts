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

  it('con texto seleccionado, la hoja parte de él y sin cambiarlo conserva su formato', () => {
    const instance = open('<p>Mira <strong>esto</strong> hoy</p>');
    instance.commands.setTextSelection({ from: 9, to: 13 });
    expect(linkState(instance).text).toBe('esto');
    applyLink(instance, 'https://a.co', 'esto');
    expect(body(instance)).toContain('<strong>esto</strong></a>');
    expect(body(instance)).toContain(' hoy');
  });

  it('con texto seleccionado y otro texto en la hoja, lo reemplaza', () => {
    const instance = open('<p>Mira esto hoy</p>');
    instance.commands.setTextSelection({ from: 9, to: 13 });
    applyLink(instance, 'https://a.co', 'la página');
    expect(body(instance)).toBe(
      '<p>Mira <a href="https://a.co">la página</a> hoy</p>',
    );
  });

  it('los espacios de los bordes de la selección quedan fuera y no se pierden', () => {
    const instance = open('<p>Mira esto hoy</p>');
    instance.commands.setTextSelection({ from: 8, to: 14 });
    expect(linkState(instance).text).toBe('esto');
    applyLink(instance, 'https://a.co', 'esto');
    expect(body(instance)).toBe(
      '<p>Mira <a href="https://a.co">esto</a> hoy</p>',
    );
  });

  it('una selección de varios renglones se enlaza sin juntarlos', () => {
    const instance = open('<p>Uno</p><p>Dos</p>');
    instance.commands.setTextSelection({ from: 4, to: 12 });
    expect(linkState(instance).multiline).toBe(true);
    applyLink(instance, 'https://a.co', '');
    expect(body(instance)).toBe(
      '<p><a href="https://a.co">Uno</a></p><p><a href="https://a.co">Dos</a></p>',
    );
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
