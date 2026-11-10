// @vitest-environment happy-dom
import { createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPageTransition, ENTER_FRAME_MS } from './pageTransition';

const DURATION = 500;

function setup(options: { duration?: number; instant?: boolean } = {}) {
  const onSwap = vi.fn();
  const state = {
    duration: options.duration ?? DURATION,
    instant: options.instant ?? false,
  };
  const [path, setPath] = createSignal('/');
  const transition = createRoot((dispose) => ({
    ...createPageTransition({
      path,
      duration: () => state.duration,
      instant: () => state.instant,
      onSwap,
    }),
    dispose,
  }));
  return { ...transition, setPath, state, onSwap };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createPageTransition', () => {
  it('al empezar muestra la ruta inicial, en reposo y sin animar', () => {
    const { displayed, phase } = setup();
    expect(displayed()).toBe('/');
    expect(phase()).toBe('idle');
  });

  it('al navegar: la página actual sale, y al terminar se cambia el contenido y la nueva entra', () => {
    vi.useFakeTimers();
    const { displayed, phase, setPath, onSwap } = setup();
    setPath('/d/uno');
    // sale: sigue mostrándose la anterior
    expect(phase()).toBe('leaving');
    expect(displayed()).toBe('/');
    vi.advanceTimersByTime(DURATION - 1);
    expect(displayed()).toBe('/');
    expect(onSwap).not.toHaveBeenCalled();

    // termina la salida: cambia el contenido y la nueva arranca oculta
    vi.advanceTimersByTime(1);
    expect(displayed()).toBe('/d/uno');
    expect(onSwap).toHaveBeenCalledTimes(1);
    expect(phase()).toBe('entering');

    // un par de cuadros después pasa a su sitio (eso dispara la transición de entrada)
    vi.advanceTimersByTime(ENTER_FRAME_MS);
    expect(phase()).toBe('idle');
  });

  it('una redirección (instant) cambia el contenido sin animar', () => {
    const { displayed, phase, setPath, state, onSwap } = setup();
    state.instant = true;
    setPath('/d/uno');
    expect(displayed()).toBe('/d/uno');
    expect(phase()).toBe('idle');
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it('sin duración («reducir movimiento») cambia de inmediato', () => {
    const { displayed, phase, setPath } = setup({ duration: 0 });
    setPath('/d/uno');
    expect(displayed()).toBe('/d/uno');
    expect(phase()).toBe('idle');
  });

  it('navegar otra vez mientras sale no apila animaciones: se muestra la ruta más reciente', () => {
    vi.useFakeTimers();
    const { displayed, phase, setPath, onSwap } = setup();
    setPath('/d/uno');
    vi.advanceTimersByTime(200);
    setPath('/d/dos');
    expect(phase()).toBe('leaving');
    // el temporizador original sigue: no se reinicia la salida
    vi.advanceTimersByTime(DURATION - 200);
    expect(displayed()).toBe('/d/dos');
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it('volver a la página que se estaba mostrando cancela la salida', () => {
    vi.useFakeTimers();
    const { displayed, phase, setPath, onSwap } = setup();
    setPath('/d/uno');
    vi.advanceTimersByTime(100);
    setPath('/');
    expect(phase()).toBe('idle');
    vi.advanceTimersByTime(DURATION * 2);
    expect(displayed()).toBe('/');
    expect(onSwap).not.toHaveBeenCalled();
  });

  it('navegar mientras entra empieza una nueva salida', () => {
    vi.useFakeTimers();
    const { displayed, phase, setPath } = setup();
    setPath('/d/uno');
    vi.advanceTimersByTime(DURATION);
    expect(phase()).toBe('entering');
    setPath('/d/dos');
    expect(phase()).toBe('leaving');
    vi.advanceTimersByTime(DURATION);
    expect(displayed()).toBe('/d/dos');
  });

  it('al desmontar no queda ningún temporizador pendiente', () => {
    vi.useFakeTimers();
    const { dispose, setPath, displayed } = setup();
    setPath('/d/uno');
    dispose();
    vi.advanceTimersByTime(DURATION * 2);
    expect(displayed()).toBe('/');
  });
});
