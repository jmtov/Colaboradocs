// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  it('en desarrollo no registra nada', () => {
    const register = vi.fn();
    registerServiceWorker(false, { register });
    window.dispatchEvent(new Event('load'));
    expect(register).not.toHaveBeenCalled();
  });

  it('en producción registra /sw.js al cargar la página', () => {
    const register = vi.fn(async () => undefined as never);
    registerServiceWorker(true, { register });
    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('un navegador sin service workers no rompe nada', () => {
    expect(() => registerServiceWorker(true, undefined)).not.toThrow();
  });
});
