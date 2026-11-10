// @vitest-environment happy-dom
import { BottomSheet } from '@juntanza/review-ui';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

/** Una hoja controlada desde fuera, como en la app. */
function mount(initiallyOpen = false) {
  const [open, setOpen] = createSignal(initiallyOpen);
  const onClose = vi.fn(() => setOpen(false));
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <BottomSheet open={open()} title="Una hoja" onClose={onClose}>
          <p>Contenido de la hoja</p>
        </BottomSheet>
      ),
      host,
    ),
  );
  const dialog = host.querySelector('dialog') as HTMLDialogElement;
  return { host, dialog, open, setOpen, onClose };
}

/** happy-dom no calcula transiciones: se simula la duración que daría el CSS. */
function cssTransition(duration: string) {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    transitionDuration: duration,
  } as CSSStyleDeclaration);
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('BottomSheet sin transición (p. ej. «reducir movimiento»)', () => {
  it('abre y cierra de inmediato, y quita el contenido al cerrar', () => {
    const { host, dialog, setOpen } = mount();
    expect(dialog.open).toBe(false);
    setOpen(true);
    expect(dialog.open).toBe(true);
    expect(host.textContent).toContain('Contenido de la hoja');
    setOpen(false);
    expect(dialog.open).toBe(false);
    expect(host.textContent).not.toContain('Contenido de la hoja');
  });
});

describe('BottomSheet con transición', () => {
  it('al abrir se muestra fuera de pantalla y un instante después pasa a «open» (eso dispara el deslizamiento)', async () => {
    cssTransition('0.5s');
    const { dialog, setOpen } = mount();
    setOpen(true);
    expect(dialog.open).toBe(true);
    // todavía sin el estado final: no aparece de golpe
    expect(dialog.dataset.state).toBeUndefined();
    await wait(60);
    expect(dialog.dataset.state).toBe('open');
  });

  it('al cerrar sigue abierta y con su contenido mientras sale, y después se cierra', async () => {
    cssTransition('0.05s');
    const { host, dialog, setOpen } = mount(true);
    await wait(40);
    expect(dialog.dataset.state).toBe('open');

    setOpen(false);
    // saliendo: aún abierta, marcada «closing» y con el contenido puesto (no baja vacía)
    expect(dialog.open).toBe(true);
    expect(dialog.dataset.state).toBe('closing');
    expect(host.textContent).toContain('Contenido de la hoja');

    await wait(220);
    expect(dialog.open).toBe(false);
    expect(dialog.dataset.state).toBeUndefined();
    expect(host.textContent).not.toContain('Contenido de la hoja');
  });

  it('cierra en cuanto termina la transición del transform, sin esperar el plazo', async () => {
    cssTransition('5s');
    const { dialog, setOpen } = mount(true);
    await wait(40);
    setOpen(false);
    expect(dialog.open).toBe(true);
    // otras transiciones (p. ej. la del fondo) no cierran
    const other = new Event('transitionend', { bubbles: true });
    Object.defineProperty(other, 'propertyName', { value: 'opacity' });
    dialog.dispatchEvent(other);
    expect(dialog.open).toBe(true);
    const done = new Event('transitionend', { bubbles: true });
    Object.defineProperty(done, 'propertyName', { value: 'transform' });
    dialog.dispatchEvent(done);
    expect(dialog.open).toBe(false);
  });

  it('si se vuelve a abrir mientras sale, no se cierra', async () => {
    cssTransition('0.05s');
    const { dialog, setOpen } = mount(true);
    await wait(40);
    setOpen(false);
    await wait(20);
    setOpen(true);
    await wait(200);
    expect(dialog.open).toBe(true);
    expect(dialog.dataset.state).toBe('open');
  });

  it('Escape no cierra por su cuenta: pide cerrar para que salga animada', async () => {
    cssTransition('0.05s');
    const { dialog, onClose } = mount(true);
    await wait(40);
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.dataset.state).toBe('closing');
    await wait(220);
    expect(dialog.open).toBe(false);
  });

  it('REGRESIÓN: la hoja no queda flotando a mitad de pantalla (no confunde su animación de entrada con un desplazamiento a corregir)', async () => {
    // Viewport visible de 593px. Al empezar a entrar, la hoja (248px de alto) está fuera de
    // pantalla: su borde inferior mide 841 y su transform es translateY(248px).
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 593,
        offsetTop: 0,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
    vi.spyOn(
      HTMLDialogElement.prototype,
      'getBoundingClientRect',
    ).mockReturnValue({
      bottom: 841,
    } as DOMRect);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionDuration: '0.5s',
      transform: 'matrix(1, 0, 0, 1, 0, 248)',
    } as CSSStyleDeclaration);

    const { dialog, setOpen } = mount();
    setOpen(true);
    await wait(60);

    // sin teclado no hay nada que corregir: ni -248px ni ningún otro valor
    expect(dialog.style.getPropertyValue('--sheet-shift')).toBe('0px');
    expect(dialog.dataset.state).toBe('open');
    Reflect.deleteProperty(window, 'visualViewport');
  });
});
