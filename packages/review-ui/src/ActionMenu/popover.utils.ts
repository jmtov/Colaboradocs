/** Lo mínimo de un elemento `popover` que usamos (y que se puede simular en pruebas). */
export type PopoverLike = {
  matches(selector: string): boolean;
  hidePopover(): void;
  addEventListener(
    type: 'toggle',
    listener: () => void,
    options: { once: boolean },
  ): void;
};

/** Si el menú no avisa que cerró en este tiempo, se abre la hoja igual. */
export const MENU_CLOSE_TIMEOUT_MS = 250;

/**
 * Cierra el menú y, cuando ya terminó de cerrarse, ejecuta `open` (abrir una
 * hoja modal). Abrir un `<dialog>` modal en el mismo instante en que un popover
 * se está cerrando es frágil en algunos navegadores: la hoja puede quedar sin
 * contenido. Se espera al evento `toggle` del menú; si un navegador no lo envía,
 * a los 250 ms se abre igual (mejor tarde que nunca). `open` corre una sola vez.
 */
export function openAfterMenuCloses(menu: PopoverLike, open: () => void) {
  let isOpen = false;
  try {
    isOpen = menu.matches(':popover-open');
  } catch {
    // Navegador sin popover: no hay nada que esperar.
  }
  if (!isOpen) {
    open();
    return;
  }

  let done = false;
  const openOnce = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    open();
  };
  const timer = setTimeout(openOnce, MENU_CLOSE_TIMEOUT_MS);
  menu.addEventListener('toggle', openOnce, { once: true });
  menu.hidePopover();
}

/** Separación entre el botón y el menú, en px. */
const MENU_GAP_PX = 6;
/** Aire mínimo entre el menú y el borde de la pantalla, en px. */
const MENU_EDGE_PX = 8;

/**
 * Dónde queda el borde izquierdo de un menú de ancho `width` que se alinea con el borde
 * derecho `anchorRight` de su botón: ese, salvo que se salga de la pantalla (menos de
 * `edge` a la izquierda o a la derecha), y entonces el más cercano que cabe.
 */
export function menuLeft(
  anchorRight: number,
  width: number,
  viewport: number,
  edge = MENU_EDGE_PX,
): number {
  const left = anchorRight - width;
  return Math.max(edge, Math.min(left, viewport - width - edge));
}

/**
 * Abre o cierra un menú `popover` bajo su botón, alineado a la derecha del botón y sin
 * salirse de la pantalla (en un teléfono, un menú ancho con el botón en el borde derecho
 * quedaba cortado a la izquierda). El popover vive en la capa superior: se ubica a mano.
 */
export function toggleMenuBelow(trigger: HTMLElement, menu: HTMLElement) {
  if (menu.matches(':popover-open')) {
    menu.hidePopover();
    return;
  }
  const rect = trigger.getBoundingClientRect();
  menu.style.top = `${rect.bottom + MENU_GAP_PX}px`;
  menu.style.right = 'auto';
  menu.style.maxWidth = `calc(100vw - ${MENU_EDGE_PX * 2}px)`;
  menu.showPopover();
  const viewport = document.documentElement.clientWidth;
  menu.style.left = `${menuLeft(rect.right, menu.offsetWidth, viewport)}px`;
}
