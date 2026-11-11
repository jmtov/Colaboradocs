// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import BottomSheet from '../BottomSheet/BottomSheet';
import ReviewProvider from '../ReviewProvider/ReviewProvider';
import type { OverlayApi, SheetLayerProps } from './overlay.types';
import { useOverlay } from './useOverlay';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];
let overlay!: OverlayApi;

function Probe() {
  overlay = useOverlay();
  return null;
}

function Named(props: SheetLayerProps<string> & { name: string }) {
  return (
    <BottomSheet open={props.open} title={props.name} onClose={props.onClose}>
      <button type="button" onClick={() => props.close(props.name)}>
        elegir {props.name}
      </button>
    </BottomSheet>
  );
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider>
          <Probe />
        </ReviewProvider>
      ),
      host,
    ),
  );
}

const choose = (name: string) =>
  [...document.querySelectorAll('dialog button')]
    .find((button) => button.textContent === `elegir ${name}`)
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const dialogs = () => [...document.querySelectorAll('dialog')];
const openTitles = () =>
  dialogs()
    .filter((dialog) => dialog.open)
    .map((dialog) => dialog.querySelector('h2')?.textContent);

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('hojas con OverlayProvider', () => {
  it('abrir una hoja mientras otra sale: la nueva abre y la vieja se va', async () => {
    mount();
    const first = overlay.sheet(Named, { name: 'A' });
    await wait(20);
    expect(openTitles()).toEqual(['A']);

    choose('A');
    await expect(first).resolves.toBe('A');
    // B se abre en pleno cierre de A (la salida dura ~500 ms).
    void overlay.sheet(Named, { name: 'B' });
    await wait(20);
    expect(openTitles()).toContain('B');
    // A sigue montada mientras sale (se ve su animación) y conviven apiladas.
    expect(dialogs()).toHaveLength(2);
    expect(overlay.isOpen()).toBe(true);

    await wait(800);
    expect(openTitles()).toEqual(['B']);
    expect(dialogs()).toHaveLength(1);
  });

  it('cada apertura monta una hoja limpia y al cerrar se desmonta', async () => {
    mount();
    void overlay.sheet(Named, { name: 'A' });
    await wait(20);
    choose('A');
    await wait(800);
    expect(dialogs()).toHaveLength(0);
    expect(overlay.isOpen()).toBe(false);
  });
});
