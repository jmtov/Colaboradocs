import {
  openAfterMenuCloses,
  toggleMenuBelow,
  useOverlay,
  useReview,
} from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import UploadSheet from '@/DocumentsPage/components/UploadSheet/UploadSheet';

/**
 * Estado y acciones del menú de un documento. `id` llega como accessor porque
 * se lee al pulsar, no al crear. Las refs las asigna el .tsx.
 */
export function useDocumentMenu(id: () => string) {
  const review = useReview();
  const overlay = useOverlay();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  function toggle() {
    toggleMenuBelow(refs.trigger, refs.menu);
  }

  function onToggle(event: ToggleEvent) {
    setOpen(event.newState === 'open');
    if (event.newState === 'closed') setConfirming(false);
  }

  function replace() {
    openAfterMenuCloses(
      refs.menu,
      () => void overlay.sheet(UploadSheet, { target: { replaceId: id() } }),
    );
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
