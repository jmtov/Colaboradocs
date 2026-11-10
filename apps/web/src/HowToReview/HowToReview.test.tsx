// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import HowToReview, { HOWTO_OPEN_DELAY_MS } from './HowToReview';
import { howToAvailable, howToOpen, setHowToOpen } from './howto.state';

const disposers: (() => void)[] = [];

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <HowToReview />, host));
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
    expect(howToOpen()).toBe(false);
    expect(host.querySelector('dialog')?.open).toBe(false);
    await afterDelay();
    expect(howToOpen()).toBe(true);
    expect(host.querySelector('dialog')?.open).toBe(true);
    expect(host.textContent).toContain('Cómo revisar');
    expect(host.textContent).toContain('Comentar');
  });

  it('si se sale del documento antes del retraso, no se abre', async () => {
    mount();
    unmountAll();
    await afterDelay();
    expect(howToOpen()).toBe(false);
  });

  it('«Entendido» la cierra pero vuelve a abrirse la próxima vez', async () => {
    const first = mount();
    await afterDelay();
    button(first, 'Entendido')?.click();
    expect(howToOpen()).toBe(false);
    expect(localStorage.getItem('review:howto-dismissed')).toBeNull();

    unmountAll();
    mount();
    await afterDelay();
    expect(howToOpen()).toBe(true);
  });

  it('«No volver a mostrar» la cierra y ya no se abre sola', async () => {
    const first = mount();
    await afterDelay();
    button(first, 'No volver a mostrar')?.click();
    expect(howToOpen()).toBe(false);
    expect(localStorage.getItem('review:howto-dismissed')).toBe('1');

    unmountAll();
    mount();
    await afterDelay();
    expect(howToOpen()).toBe(false);
  });

  it('descartada, se puede abrir a pedido y ya no ofrece descartar de nuevo', () => {
    localStorage.setItem('review:howto-dismissed', '1');
    const host = mount();
    expect(howToOpen()).toBe(false);
    setHowToOpen(true);
    expect(button(host, 'No volver a mostrar')).toBeUndefined();
    expect(button(host, 'Entendido')).toBeDefined();
  });

  it('avisa si hay un documento abierto, y lo olvida al salir', () => {
    mount();
    expect(howToAvailable()).toBe(true);
    unmountAll();
    expect(howToAvailable()).toBe(false);
    expect(howToOpen()).toBe(false);
  });
});
