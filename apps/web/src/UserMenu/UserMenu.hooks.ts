import { useReview } from '@juntanza/review-ui';
import { createSignal } from 'solid-js';
import { setDocumentsOpen } from '@/DocumentsSheet/documentsSheet.state';
import { setHowToOpen } from '@/HowToReview/howto.state';
import { openAfterMenuCloses } from './menu.utils';
import { MENU_GAP_PX } from './UserMenu.constants';

/** Estado y acciones del menú de la sesión. Las refs las asigna el .tsx. */
export function useUserMenu() {
  const review = useReview();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);
  const [accessOpen, setAccessOpen] = createSignal(false);

  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;

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

  function openAccess() {
    openAfterMenuCloses(refs.menu, () => setAccessOpen(true));
  }

  function closeAccess() {
    setAccessOpen(false);
  }

  function openHowTo() {
    openAfterMenuCloses(refs.menu, () => setHowToOpen(true));
  }

  function openDocuments() {
    openAfterMenuCloses(refs.menu, () => setDocumentsOpen(true));
  }

  function logout() {
    refs.menu.hidePopover();
    review.logout();
  }

  return {
    refs,
    open,
    accessOpen,
    me,
    onToggle,
    toggle,
    openAccess,
    closeAccess,
    openHowTo,
    openDocuments,
    logout,
  };
}
