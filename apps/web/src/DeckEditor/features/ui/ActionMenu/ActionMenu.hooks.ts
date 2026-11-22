import { createSignal } from 'solid-js';

/** Coloca el menú junto a su botón (el `popover` vive en la capa superior, fuera del flujo) y lo mantiene dentro de la ventana. */
export function useMenuPosition() {
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
  const [menu, setMenu] = createSignal<HTMLElement>();

  function place(event: ToggleEvent) {
    const button = trigger();
    const el = menu();
    if (event.newState !== 'open' || !button || !el) return;
    const rect = button.getBoundingClientRect();
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    const below = rect.bottom + 4;
    const top =
      below + height > window.innerHeight - 8
        ? Math.max(8, rect.top - height - 4)
        : below;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  return { setTrigger, setMenu, place, close: () => menu()?.hidePopover() };
}
