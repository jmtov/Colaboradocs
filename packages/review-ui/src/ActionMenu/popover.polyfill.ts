/**
 * Atributo `popover` para navegadores que no lo traen (Safari < 17, p. ej. iPadOS 15).
 * Solo lo que usan los menús: `showPopover`, `hidePopover`, `popovertarget`, cierre al pulsar
 * fuera o con Esc, y el evento `toggle` con `newState`. Si el navegador ya lo trae, no hace nada.
 */
const OPEN_CLASS = 'popover-open';

type PopoverElement = HTMLElement & { popover?: string | null };

const STYLE = `
[popover] { position: fixed; margin: 0; inset: auto; overflow: auto; }
[popover]:not(.${OPEN_CLASS}) { display: none; }
`;

/** Cuándo (en orden de llegada) cambió cada menú por última vez; sirve para el cierre por clic fuera. */
const lastChange = new WeakMap<HTMLElement, number>();
let tick = 0;

function setOpen(menu: HTMLElement, open: boolean) {
  if (menu.classList.contains(OPEN_CLASS) === open) return;
  lastChange.set(menu, ++tick);
  menu.classList.toggle(OPEN_CLASS, open);
  const event = new Event('toggle');
  Object.assign(event, {
    newState: open ? 'open' : 'closed',
    oldState: open ? 'closed' : 'open',
  });
  menu.dispatchEvent(event);
}

function openMenus(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`.${OPEN_CLASS}`));
}

/** ¿Está abierto? Con `:popover-open` si el navegador lo entiende; si no, con la clase del polyfill. */
export function isPopoverOpen(menu: HTMLElement): boolean {
  const polyfilled = menu.classList?.contains(OPEN_CLASS) ?? false;
  try {
    return menu.matches(':popover-open') || polyfilled;
  } catch {
    return polyfilled;
  }
}

export function installPopoverPolyfill(): void {
  if ('popover' in HTMLElement.prototype) return;

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  const proto = HTMLElement.prototype as PopoverElement & {
    showPopover(): void;
    hidePopover(): void;
  };
  proto.showPopover = function showPopover(this: HTMLElement) {
    for (const other of openMenus()) if (other !== this) setOpen(other, false);
    setOpen(this, true);
  };
  proto.hidePopover = function hidePopover(this: HTMLElement) {
    setOpen(this, false);
  };

  // El orden se marca antes de que corra cualquier handler del clic (captura): un menú que
  // cambie durante este clic, antes o después de este listener, no se cierra por «clic fuera».
  let clickStamp = 0;
  document.addEventListener(
    'click',
    () => {
      clickStamp = ++tick;
    },
    true,
  );
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const trigger = target?.closest<HTMLElement>('[popovertarget]');
    if (trigger) {
      const menu = document.getElementById(
        trigger.getAttribute('popovertarget') ?? '',
      );
      if (menu) {
        const opening = !menu.classList.contains(OPEN_CLASS);
        // Como un popover nativo, abrir uno cierra los demás.
        if (opening) {
          for (const other of openMenus())
            if (other !== menu) setOpen(other, false);
        }
        setOpen(menu, opening);
      }
      return;
    }
    // Los botones que abren o cierran su menú (`toggleMenuBelow`) corren después de este
    // listener: si se cerrara aquí, el botón de un menú abierto lo volvería a abrir. Se cierra
    // en el turno siguiente y solo los menús que nadie tocó desde este clic.
    const clickedAt = clickStamp;
    setTimeout(() => {
      for (const menu of openMenus()) {
        if (menu.contains(target)) continue;
        if ((lastChange.get(menu) ?? 0) > clickedAt) continue;
        setOpen(menu, false);
      }
    }, 0);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const menu of openMenus()) setOpen(menu, false);
  });
}
