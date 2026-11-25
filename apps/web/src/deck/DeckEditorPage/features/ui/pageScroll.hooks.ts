import { onCleanup, onMount } from 'solid-js';

/**
 * Mientras la pantalla está montada, la página no se desplaza: la pantalla ocupa todo el alto y cada
 * panel lleva su propio scroll. Sin esto, la rueda a veces mueve la página en lugar del panel.
 * Al desmontarse devuelve lo que había.
 */
export function useLockPageScroll() {
  onMount(() => {
    const targets = [document.documentElement, document.body];
    const previous = targets.map((element) => element.style.overflow);
    for (const element of targets) element.style.overflow = 'hidden';
    onCleanup(() => {
      targets.forEach((element, i) => {
        element.style.overflow = previous[i] ?? '';
      });
    });
  });
}
