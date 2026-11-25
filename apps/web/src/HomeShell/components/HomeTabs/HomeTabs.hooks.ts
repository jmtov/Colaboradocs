import { createEffect, onCleanup, onMount } from 'solid-js';

/**
 * Coloca la caja que desliza tras el tab activo: mide el tab (`aria-current="page"`) y lo deja en las
 * variables `--tab-x` y `--tab-w` de la barra. `track` lista lo que cambia su ancho o su lugar (el tab
 * activo, los contadores, qué tabs hay). La primera medida no se anima (la caja nace en su sitio).
 */
export function useTabIndicator(track: () => unknown) {
  let nav: HTMLElement | undefined;

  function place() {
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    nav.style.setProperty('--tab-x', `${active.offsetLeft}px`);
    nav.style.setProperty('--tab-w', `${active.offsetWidth}px`);
  }

  createEffect(() => {
    track();
    place();
  });

  onMount(() => {
    // Con la tipografía ya cargada el ancho cambia; sin esto la raya queda corrida.
    void document.fonts?.ready.then(place);
    // Se activa la transición un cuadro después de la primera medida.
    const frame = requestAnimationFrame(() => {
      nav?.setAttribute('data-ready', '');
    });
    window.addEventListener('resize', place);
    onCleanup(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
    });
  });

  return {
    setNav: (element: HTMLElement) => {
      nav = element;
    },
  };
}
