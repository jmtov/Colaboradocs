import { AccessSheet, useOverlay, useReview } from '@juntanza/review-ui';
import { createSignal } from 'solid-js';
import DocumentsSheet from '@/DocumentsSheet/DocumentsSheet';
import HowToSheet from '@/HowToReview/components/HowToSheet/HowToSheet';
import { openAfterMenuCloses } from './menu.utils';
import { MENU_GAP_PX } from './UserMenu.constants';

/** Estado y acciones del menú de la sesión. Las refs las asigna el .tsx. */
export function useUserMenu() {
  const review = useReview();
  const overlay = useOverlay();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);

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
    openAfterMenuCloses(refs.menu, () => void overlay.sheet(AccessSheet, {}));
  }

  function openHowTo() {
    openAfterMenuCloses(refs.menu, () => {
      // Sin duplicar: si ya hay una hoja abierta (la guía de la página, por ejemplo), no se abre otra.
      if (!overlay.isOpen()) void overlay.sheet(HowToSheet, {});
    });
  }

  function openDocuments() {
    openAfterMenuCloses(
      refs.menu,
      () => void overlay.sheet(DocumentsSheet, {}),
    );
  }

  function logout() {
    refs.menu.hidePopover();
    review.logout();
  }

  return {
    refs,
    open,
    me,
    onToggle,
    toggle,
    openAccess,
    openHowTo,
    openDocuments,
    logout,
  };
}
