// @vitest-environment happy-dom
import {
  type OverlayApi,
  ReviewProvider,
  useOverlay,
} from '@juntanza/review-ui';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import HowToSheet from './components/HowToSheet/HowToSheet';
import HowToReview from './HowToReview';
import { HOWTO_OPEN_DELAY_MS } from './HowToReview.constants';
import { howToAvailable, setHowToAvailable } from './howto.state';

const disposers: (() => void)[] = [];
let overlay!: OverlayApi;

/** Captura la API de hojas del ReviewProvider, como la usa la app. */
function Probe() {
  overlay = useOverlay();
  return null;
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider>
          <Probe />
          <HowToReview />
        </ReviewProvider>
      ),
      host,
    ),
  );
  return host;
}

/** Espera a que pase el retraso con el que se abre la guía. */
const afterDelay = () =>
  new Promise((resolve) => setTimeout(resolve, HOWTO_OPEN_DELAY_MS + 40));

const button = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll('button')].find((item) =>
    item.textContent?.includes(text),
  );

function unmountAll() {
  for (const dispose of disposers.splice(0)) dispose();
}

afterEach(() => {
  unmountAll();
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('HowToReview', () => {
  it('se abre sola poco después de entrar al documento, no de inmediato', async () => {
    const host = mount();
    // al montar todavía no: la página se pinta primero
    expect(overlay.isOpen()).toBe(false);
    expect(host.querySelector('dialog')).toBeNull();
    await afterDelay();
    expect(overlay.isOpen()).toBe(true);
    expect(host.querySelector('dialog')?.open).toBe(true);
    expect(host.textContent).toContain('Cómo revisar');
    expect(host.textContent).toContain('Comentar');
  });

  it('si se sale del documento antes del retraso, no se abre', async () => {
    mount();
    const opened = overlay;
    unmountAll();
    await afterDelay();
    expect(opened.isOpen()).toBe(false);
  });

  it('«Entendido» la cierra pero vuelve a abrirse la próxima vez', async () => {
    const first = mount();
    await afterDelay();
    button(first, 'Entendido')?.click();
    expect(overlay.isOpen()).toBe(false);
    expect(localStorage.getItem('review:howto-dismissed')).toBeNull();

    unmountAll();
    mount();
    await afterDelay();
    expect(overlay.isOpen()).toBe(true);
  });

  it('«No volver a mostrar» la cierra y ya no se abre sola', async () => {
    const first = mount();
    await afterDelay();
    button(first, 'No volver a mostrar')?.click();
    expect(overlay.isOpen()).toBe(false);
    expect(localStorage.getItem('review:howto-dismissed')).toBe('1');

    unmountAll();
    mount();
    await afterDelay();
    expect(overlay.isOpen()).toBe(false);
  });

  it('descartada, se puede abrir a pedido y ya no ofrece descartar de nuevo', () => {
    localStorage.setItem('review:howto-dismissed', '1');
    const host = mount();
    expect(overlay.isOpen()).toBe(false);
    void overlay.sheet(HowToSheet, {});
    expect(button(host, 'No volver a mostrar')).toBeUndefined();
    expect(button(host, 'Entendido')).toBeDefined();
  });

  it('si se sale del documento con la guía abierta, se cierra', async () => {
    mount();
    await afterDelay();
    expect(overlay.isOpen()).toBe(true);
    setHowToAvailable(false);
    expect(overlay.isOpen()).toBe(false);
    setHowToAvailable(true);
  });

  it('avisa si hay un documento abierto, y lo olvida al salir', () => {
    mount();
    expect(howToAvailable()).toBe(true);
    unmountAll();
    expect(howToAvailable()).toBe(false);
    expect(overlay.isOpen()).toBe(false);
  });
});
