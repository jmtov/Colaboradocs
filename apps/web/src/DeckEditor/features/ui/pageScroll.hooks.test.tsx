// @vitest-environment happy-dom
import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { useLockPageScroll } from './pageScroll.hooks';

describe('useLockPageScroll', () => {
  it('bloquea el scroll de la página mientras está montado y lo devuelve al desmontarse', () => {
    document.body.style.overflow = 'scroll';
    const dispose = createRoot((dispose) => {
      useLockPageScroll();
      return dispose;
    });
    // onMount corre tras el montaje
    return Promise.resolve().then(() => {
      expect(document.documentElement.style.overflow).toBe('hidden');
      expect(document.body.style.overflow).toBe('hidden');
      dispose();
      expect(document.documentElement.style.overflow).toBe('');
      expect(document.body.style.overflow).toBe('scroll');
    });
  });
});
