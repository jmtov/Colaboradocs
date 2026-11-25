// @vitest-environment happy-dom
import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';
import { useBarHidden } from './DeckPage.hooks';

afterEach(() => localStorage.clear());

describe('useBarHidden', () => {
  it('arranca visible, oculta y vuelve a mostrar, y lo recuerda', () => {
    createRoot((dispose) => {
      const bar = useBarHidden();
      expect(bar.hidden()).toBe(false);
      bar.hide();
      expect(bar.hidden()).toBe(true);
      expect(localStorage.getItem('review:deck-bar-hidden')).toBe('1');
      bar.show();
      expect(bar.hidden()).toBe(false);
      expect(localStorage.getItem('review:deck-bar-hidden')).toBe('0');
      dispose();
    });
  });

  it('si ya estaba oculta en este navegador, arranca oculta', () => {
    localStorage.setItem('review:deck-bar-hidden', '1');
    createRoot((dispose) => {
      expect(useBarHidden().hidden()).toBe(true);
      dispose();
    });
  });
});
