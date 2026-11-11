import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOSE_MS } from './overlay.constants';
import { createOverlayStore } from './overlay.store';

const component = () => null;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createOverlayStore', () => {
  it('abrir monta la hoja con sus props; cerrar con resultado resuelve la promesa', async () => {
    const store = createOverlayStore();
    const result = store.sheet(component, { id: 'a' });
    expect(store.layers()).toHaveLength(1);
    expect(store.layers()[0]?.props).toEqual({ id: 'a' });
    expect(store.isOpen()).toBe(true);
    store.layers()[0]?.close('elegido');
    await expect(result).resolves.toBe('elegido');
  });

  it('al cerrar deja de estar abierta ya, pero sigue montada hasta que acaba la salida', () => {
    const store = createOverlayStore();
    void store.sheet(component, {});
    store.layers()[0]?.close();
    expect(store.layers()).toHaveLength(1);
    expect(store.layers()[0]?.open()).toBe(false);
    expect(store.isOpen()).toBe(false);
    vi.advanceTimersByTime(CLOSE_MS);
    expect(store.layers()).toHaveLength(0);
  });

  it('cerrar sin resultado (Esc, fondo) resuelve con undefined', async () => {
    const store = createOverlayStore();
    const result = store.sheet(component, {});
    store.layers()[0]?.close();
    await expect(result).resolves.toBeUndefined();
  });

  it('cerrar dos veces no vuelve a resolver ni a programar el desmontaje', async () => {
    const store = createOverlayStore();
    const result = store.sheet(component, {});
    const layer = store.layers()[0];
    layer?.close('primero');
    layer?.close('segundo');
    await expect(result).resolves.toBe('primero');
  });

  it('las hojas se apilan; cerrar una no toca a la otra, y una nueva se abre mientras la anterior sale', () => {
    const store = createOverlayStore();
    void store.sheet(component, { name: 'A' });
    const [first] = store.layers();
    first?.close();
    // B se abre mientras A todavía está saliendo: no se pisan.
    void store.sheet(component, { name: 'B' });
    expect(store.layers().map((layer) => layer.open())).toEqual([false, true]);
    expect(store.isOpen()).toBe(true);
    vi.advanceTimersByTime(CLOSE_MS);
    expect(store.layers().map((layer) => layer.props)).toEqual([{ name: 'B' }]);
  });
});
