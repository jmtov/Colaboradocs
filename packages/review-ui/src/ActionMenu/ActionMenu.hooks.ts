import { createSignal } from 'solid-js';
import { MENU_GAP_PX } from './ActionMenu.constants';
import type { ActionMenuItem } from './ActionMenu.types';
import { openAfterMenuCloses } from './popover.utils';

/** Estado y acciones de un menú de acciones. Las refs las asigna el .tsx. */
export function useActionMenu() {
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);

  function toggle() {
    if (!refs.menu.matches(':popover-open')) {
      // El popover vive en la capa superior: se ubica bajo el botón, alineado a la derecha.
      const rect = refs.trigger.getBoundingClientRect();
      refs.menu.style.top = `${rect.bottom + MENU_GAP_PX}px`;
      refs.menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    }
    refs.menu.togglePopover();
  }

  function onToggle(event: ToggleEvent) {
    setOpen(event.newState === 'open');
  }

  /** Cierra el menú y, ya cerrado, hace la acción (una hoja modal no se abre en pleno cierre). */
  function select(item: ActionMenuItem) {
    openAfterMenuCloses(refs.menu, item.onSelect);
  }

  return { refs, open, toggle, onToggle, select };
}
