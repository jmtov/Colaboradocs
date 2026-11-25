import { createSignal, onCleanup } from 'solid-js';
import { SCROLL_IDLE_MS } from './scrolling.constants';

/**
 * Si un contenedor se está desplazando ahora mismo. Mientras dura, el CSS le quita los eventos de
 * puntero al contenido: así, al pasar bajo el cursor, los botones no arrancan su animación de
 * «levantado» ni las filas mandan avisos de hover, y el scroll no compite con ellos.
 */
export function useScrolling() {
  const [scrolling, setScrolling] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  return {
    scrolling,
    onScroll: () => {
      setScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    },
  };
}
