import { openAfterMenuCloses, toggleMenuBelow } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';

type Actions = {
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Estado del menú de una tarea. Las refs las asigna el .tsx. */
export function useTaskMenu(actions: () => Actions) {
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);

  function toggle() {
    toggleMenuBelow(refs.trigger, refs.menu);
  }

  function onToggle(event: ToggleEvent) {
    setOpen(event.newState === 'open');
    if (event.newState === 'closed') setConfirming(false);
  }

  function edit() {
    const onEdit = actions().onEdit;
    if (onEdit) openAfterMenuCloses(refs.menu, onEdit);
  }

  function remove() {
    refs.menu.hidePopover();
    actions().onDelete?.();
  }

  return {
    refs,
    open,
    confirming,
    toggle,
    onToggle,
    edit,
    remove,
    askRemove: () => setConfirming(true),
    cancelRemove: () => setConfirming(false),
  };
}
