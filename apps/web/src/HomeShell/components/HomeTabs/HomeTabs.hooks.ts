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
    // El primer tab no lleva aire a la izquierda (su texto alinea con la página); la caja sí lo
    // necesita, así que se le suma el aire de sus vecinos.
    const neighbour = nav.querySelector<HTMLElement>('a:not(:first-child)');
    const pad =
      active === nav.firstElementChild && neighbour
        ? Number.parseFloat(getComputedStyle(neighbour).paddingLeft) || 0
        : 0;
    nav.style.setProperty('--tab-x', `${active.offsetLeft - pad}px`);
    nav.style.setProperty('--tab-w', `${active.offsetWidth + pad}px`);
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
