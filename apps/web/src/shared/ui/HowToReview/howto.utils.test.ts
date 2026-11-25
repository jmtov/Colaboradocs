// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dismissHowTo, isHowToDismissed } from './howto.utils';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('howto.utils', () => {
  it('por defecto no está descartada, y descartar se recuerda', () => {
    expect(isHowToDismissed()).toBe(false);
    dismissHowTo();
    expect(isHowToDismissed()).toBe(true);
  });

  it('sin almacenamiento no falla: simplemente se vuelve a mostrar', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(isHowToDismissed()).toBe(false);
    expect(() => dismissHowTo()).not.toThrow();
  });
});
