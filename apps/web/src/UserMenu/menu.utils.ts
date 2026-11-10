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
