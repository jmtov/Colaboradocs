// @vitest-environment happy-dom
import type { Editor } from '@tiptap/core';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import {
  addNote,
  addTerm,
  locateSections,
  removeSection,
  sectionAt,
  updateSection,
} from '../section.commands';
import DocumentEditor from './DocumentEditor';

const disposers: (() => void)[] = [];

const SECTIONS: DocumentSection[] = [
  {
    id: 'uno',
    num: '1',
    title: 'Primera',
    status: 'listo',
    html: '<p>Hola</p>',
  },
  {
    id: 'dos',
    num: '2',
    title: 'Segunda',
    status: 'borrador',
    html: '<p>Mundo</p>',
  },
  {
    id: 'glosario',
    num: 'A',
    title: 'Glosario',
    status: 'listo',
    html: '<dl><dt>T</dt><dd>D</dd></dl>',
  },
];

function mount(sections = SECTIONS) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const onChange = vi.fn<(value: DocumentSection[]) => void>();
  let editor!: Editor;
  disposers.push(
    render(
      () => (
        <DocumentEditor
          sections={sections}
          onChange={onChange}
          onReady={(value) => {
            editor = value;
          }}
        />
      ),
      host,
    ),
  );
  const last = () => onChange.mock.lastCall?.[0] ?? [];
  return { host, onChange, editor: () => editor, last };
}

/** Pone el cursor al final del texto de un bloque (por posición dentro del documento). */
const endOf = (editor: Editor, text: string) => {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock && node.textContent === text)
      found = pos + node.nodeSize - 1;
  });
  editor.commands.focus(found);
};

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

describe('DocumentEditor', () => {
  it('muestra todo el documento: cada sección con su título', () => {
    const { host } = mount();
    const titles = [...host.querySelectorAll('h2')].map((h) => h.textContent);
    expect(titles).toEqual(['Primera', 'Segunda', 'Glosario']);
    expect(
      host.querySelector('.ProseMirror')?.getAttribute('contenteditable'),
    ).toBe('true');
  });

  it('escribir entrega las secciones en el formato del documento', () => {
    const { editor, last } = mount();
    endOf(editor(), 'Hola');
    editor().commands.insertContent(' otra vez');
    expect(last()[0]?.html).toBe('<p>Hola otra vez</p>');
    expect(last().map((item) => item.id)).toEqual(['uno', 'dos', 'glosario']);
    expect(last().map((item) => item.num)).toEqual(['1', '2', 'A']);
  });

  it('un párrafo que pasa a título parte la sección y recibe un id nuevo', () => {
    const { editor, last } = mount([
      {
        id: 'uno',
        num: '1',
        title: 'Primera',
        status: 'listo',
        html: '<p>Hola</p><p>Corte</p><p>Fin</p>',
      },
    ]);
    endOf(editor(), 'Corte');
    editor().commands.setNode('sectionTitle');
    expect(last().map((item) => item.title)).toEqual(['Primera', 'Corte']);
    expect(last().map((item) => item.html)).toEqual([
      '<p>Hola</p>',
      '<p>Fin</p>',
    ]);
    const ids = last().map((item) => item.id);
    expect(ids[0]).toBe('uno');
    expect(ids[1]).toMatch(/^s-[0-9a-f]{8}$/);
  });

  it('un título pegado con un id repetido recibe otro', () => {
    const { editor, last } = mount();
    editor().commands.focus('end');
    editor().commands.insertContent('<h2 data-id="uno">Copia</h2><p>x</p>');
    const ids = last().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 3)).toEqual(['uno', 'dos', 'glosario']);
  });

  it('Enter en el título lleva al cuerpo sin crear párrafos de más', () => {
    const { editor, last } = mount();
    editor().commands.focus(1 + 'Primera'.length);
    const before = editor().state.doc.childCount;
    editor().view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(editor().state.doc.childCount).toBe(before);
    expect(sectionAt(editor())).toBe('uno');
    expect(editor().state.selection.$from.parent.textContent).toBe('Hola');
    expect(last().length).toBeLessThanOrEqual(3);
  });

  it('Backspace al inicio del título une la sección con la anterior', () => {
    const { editor, last } = mount();
    let start = -1;
    editor().state.doc.descendants((node, pos) => {
      if (node.type.name === 'sectionTitle' && node.textContent === 'Segunda')
        start = pos + 1;
    });
    editor().commands.focus(start);
    editor().view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
    );
    expect(last().map((item) => item.id)).toEqual(['uno', 'glosario']);
    expect(last()[0]?.html).toBe('<p>Hola</p><p>Segunda</p><p>Mundo</p>');
  });

  it('Backspace al inicio de la primera sección no hace nada', () => {
    const { editor, onChange } = mount();
    editor().commands.focus(1);
    editor().view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(locateSections(editor().state.doc)).toHaveLength(3);
  });

  it('el documento siempre empieza con un título', () => {
    const { editor } = mount();
    expect(editor().state.doc.firstChild?.type.name).toBe('sectionTitle');
    expect(editor().can().setNode('paragraph')).toBe(false);
  });
});

describe('comandos de sección', () => {
  it('sectionAt sigue al cursor', () => {
    const { editor } = mount();
    endOf(editor(), 'Mundo');
    expect(sectionAt(editor())).toBe('dos');
    endOf(editor(), 'Hola');
    expect(sectionAt(editor())).toBe('uno');
  });

  it('updateSection cambia estado, descripción y anexo sin tocar el texto', () => {
    const { editor, last } = mount();
    updateSection(editor(), 'dos', {
      status: 'listo',
      description: 'Resumen',
      annex: true,
    });
    expect(last()[1]).toMatchObject({
      id: 'dos',
      status: 'listo',
      description: 'Resumen',
      num: 'A',
      html: '<p>Mundo</p>',
    });
    expect(last().map((item) => item.num)).toEqual(['1', 'A', 'B']);
  });

  it('removeSection borra título y cuerpo; la última no se puede borrar', () => {
    const { editor, last } = mount();
    expect(removeSection(editor(), 'dos')).toBe(true);
    expect(last().map((item) => item.id)).toEqual(['uno', 'glosario']);
    expect(editor().getText()).not.toContain('Mundo');
    expect(removeSection(editor(), 'glosario')).toBe(true);
    expect(removeSection(editor(), 'uno')).toBe(false);
    expect(last().map((item) => item.id)).toEqual(['uno']);
  });

  it('addNote pone «Para qué sirve.» al inicio de la sección actual y la marca como nota', () => {
    const { editor, last, host } = mount();
    endOf(editor(), 'Mundo');
    addNote(editor());
    expect(last()[1]?.html).toBe(
      '<p><strong>Para qué sirve.</strong> </p><p>Mundo</p>'.replace(
        '</strong> </p>',
        '</strong> </p>',
      ),
    );
    expect(host.querySelectorAll('[data-note]')).toHaveLength(1);
  });

  it('addNote no agrega una segunda nota: lleva el cursor a la que ya hay', () => {
    const { editor, last } = mount([
      {
        id: 'uno',
        num: '1',
        title: 'Primera',
        status: 'listo',
        html: '<p><strong>Para qué sirve.</strong> Explica.</p><p>Hola</p>',
      },
    ]);
    endOf(editor(), 'Hola');
    addNote(editor());
    expect(last()).toEqual([]);
    expect(editor().getText()).not.toContain('Para qué sirve. Para qué sirve.');
    let notes = 0;
    editor().state.doc.forEach((node) => {
      if (node.textContent.startsWith('Para qué sirve')) notes += 1;
    });
    expect(notes).toBe(1);
    expect(editor().state.selection.$from.parent.textContent).toBe(
      'Para qué sirve. Explica.',
    );
  });

  it('addTerm agrega un término al final del glosario, o crea la lista', () => {
    const { editor, last } = mount();
    endOf(editor(), 'D');
    addTerm(editor());
    expect(last()[2]?.html).toBe(
      '<dl><dt>T</dt><dd>D</dd><dt>Nuevo término</dt><dd>Definición</dd></dl>',
    );
    endOf(editor(), 'Hola');
    addTerm(editor());
    expect(last()[0]?.html).toBe(
      '<p>Hola</p><dl><dt>Nuevo término</dt><dd>Definición</dd></dl>',
    );
  });
});
