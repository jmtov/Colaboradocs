// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import MenuPanel from './MenuPanel';

const disposers: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  let panel: HTMLDivElement | undefined;
  disposers.push(
    render(
      () => (
        <MenuPanel ref={(element) => (panel = element)}>
          <button type="button">Opción</button>
        </MenuPanel>
      ),
      host,
    ),
  );
  if (!panel) throw new Error('falta el panel');
  return panel;
}

const fire = (panel: HTMLElement, type: string, newState: string) => {
  const event = new Event(type);
  Object.assign(event, { newState });
  panel.dispatchEvent(event);
};

describe('MenuPanel: el contenido se monta al abrirse', () => {
  it('cerrado no tiene opciones en el DOM', () => {
    expect(mount().querySelector('button')).toBeNull();
  });

  it('al abrirse (beforetoggle) monta las opciones, y al cerrarse (toggle) las quita', () => {
    const panel = mount();
    fire(panel, 'beforetoggle', 'open');
    expect(panel.querySelector('button')).not.toBeNull();
    fire(panel, 'toggle', 'closed');
    expect(panel.querySelector('button')).toBeNull();
  });

  it('el polyfill solo manda toggle: también monta', () => {
    const panel = mount();
    fire(panel, 'toggle', 'open');
    expect(panel.querySelector('button')).not.toBeNull();
  });
});
