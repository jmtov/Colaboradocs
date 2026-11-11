// @vitest-environment happy-dom
import type { Editor } from '@tiptap/core';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SectionEditor from './SectionEditor';

const disposers: (() => void)[] = [];

function mount(html: string) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const onChange = vi.fn();
  let editor!: Editor;
  disposers.push(
    render(
      () => (
        <SectionEditor
          html={html}
          onChange={onChange}
          onReady={(value) => {
            editor = value;
          }}
        />
      ),
      host,
    ),
  );
  return { host, onChange, editor: () => editor };
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

describe('SectionEditor', () => {
  it('muestra el contenido y es editable', () => {
    const { host } = mount(
      '<p>Hola <strong>mundo</strong></p><ul><li>Uno</li></ul>',
    );
    const prose = host.querySelector('.ProseMirror');
    expect(prose?.getAttribute('contenteditable')).toBe('true');
    expect(prose?.textContent).toBe('Hola mundoUno');
  });

  it('cada cambio entrega el HTML del documento (viñetas planas)', () => {
    const { onChange, editor } = mount('<ul><li>Uno</li></ul>');
    editor().commands.focus('end');
    editor().commands.insertContent(' dos');
    expect(onChange).toHaveBeenCalledWith('<ul><li>Uno dos</li></ul>');
  });

  it('no deja escribir lo que el formato no admite', () => {
    const { onChange, editor } = mount('<p>x</p>');
    editor().commands.setContent(
      '<table><tr><td>celda</td></tr></table><script>1</script><p>y</p>',
      {
        emitUpdate: true,
      },
    );
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).not.toMatch(/<(table|tr|td|script)/);
    expect(html).toContain('celda');
  });

  it('una viñeta con dos párrafos se junta en uno solo', () => {
    const { onChange, editor } = mount('<ul><li>Uno</li></ul>');
    editor().commands.setContent('<ul><li><p>a</p><p>b</p></li></ul>', {
      emitUpdate: true,
    });
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).not.toMatch(/<\/p><p>/);
    expect(html).toContain('a');
    expect(html).toContain('b');
  });

  it('se destruye al desmontar', () => {
    const { host } = mount('<p>x</p>');
    for (const dispose of disposers.splice(0)) dispose();
    expect(host.querySelector('.ProseMirror')).toBeNull();
  });
});
