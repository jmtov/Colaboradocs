import {
  openAfterMenuCloses,
  toggleMenuBelow,
  useOverlay,
  useReview,
} from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import HowToSheet from '@/HowToReview/components/HowToSheet/HowToSheet';
import { type AdminPageName, adminPath, navigate } from '@/router/router';

/** Estado y acciones del menú de la sesión. Las refs las asigna el .tsx. */
export function useUserMenu() {
  const review = useReview();
  const overlay = useOverlay();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);

  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;

  function toggle() {
    toggleMenuBelow(refs.trigger, refs.menu);
  }

  function onToggle(event: ToggleEvent) {
    setOpen(event.newState === 'open');
  }

  /** Va a una página de administración con el menú ya cerrado. */
  function goToAdmin(page: AdminPageName) {
    openAfterMenuCloses(refs.menu, () => navigate(adminPath(page)));
  }

  function openHowTo() {
    openAfterMenuCloses(refs.menu, () => {
      // Sin duplicar: si ya hay una hoja abierta (la guía de la página, por ejemplo), no se abre otra.
      if (!overlay.isOpen()) void overlay.sheet(HowToSheet, {});
    });
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
    openHowTo,
    goToAdmin,
    logout,
  };
}
