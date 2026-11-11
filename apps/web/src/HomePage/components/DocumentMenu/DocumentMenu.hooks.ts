import { useReview } from '@juntanza/review-ui';
import { createSignal } from 'solid-js';
import { setUploadTarget } from '@/DocumentsSheet/documentsSheet.state';
import { openAfterMenuCloses } from '@/UserMenu/menu.utils';
import { MENU_GAP_PX } from './DocumentMenu.constants';

/**
 * Estado y acciones del menú de un documento. `id` llega como accessor porque
 * se lee al pulsar, no al crear. Las refs las asigna el .tsx.
 */
export function useDocumentMenu(id: () => string) {
  const review = useReview();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

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
    if (event.newState === 'closed') setConfirming(false);
  }

  function replace() {
    openAfterMenuCloses(refs.menu, () => setUploadTarget({ replaceId: id() }));
  }

  function askArchive() {
    setConfirming(true);
  }

  function cancelArchive() {
    setConfirming(false);
  }

  async function archive() {
    setBusy(true);
    const result = await review.archiveDocument(id());
    setBusy(false);
    refs.menu.hidePopover();
    review.flash(result.ok ? 'Documento archivado.' : result.message);
  }

  return {
    refs,
    open,
    confirming,
    busy,
    toggle,
    onToggle,
    replace,
    askArchive,
    cancelArchive,
    archive,
  };
}
