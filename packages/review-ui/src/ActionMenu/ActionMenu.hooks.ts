import { createSignal } from 'solid-js';
import type { ActionMenuItem } from './ActionMenu.types';
import { openAfterMenuCloses, toggleMenuBelow } from './popover.utils';

/** Estado y acciones de un menú de acciones. Las refs las asigna el .tsx. */
export function useActionMenu() {
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);

  function toggle() {
    toggleMenuBelow(refs.trigger, refs.menu);
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
