import {
  openAfterMenuCloses,
  toggleMenuBelow,
  useReview,
} from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { deckEditPath, navigate } from '@/shared/router/router';

/** Estado y acciones del menú de una presentación (`id` llega como accessor: se lee al pulsar). */
export function useDeckMenu(id: () => string, onChange: () => void) {
  const review = useReview();
  const refs = {} as { trigger: HTMLButtonElement; menu: HTMLDivElement };
  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  function onToggle(event: ToggleEvent) {
    setOpen(event.newState === 'open');
    if (event.newState === 'closed') setConfirming(false);
  }

  async function archive() {
    setBusy(true);
    try {
      await review.archiveDeck(id());
      review.flash('Presentación archivada.');
      onChange();
    } catch {
      review.flash('No se pudo archivar.');
    } finally {
      setBusy(false);
      refs.menu.hidePopover();
    }
  }

  return {
    refs,
    open,
    confirming,
    busy,
    toggle: () => toggleMenuBelow(refs.trigger, refs.menu),
    onToggle,
    edit: () =>
      openAfterMenuCloses(refs.menu, () => navigate(deckEditPath(id()))),
    askArchive: () => setConfirming(true),
    cancelArchive: () => setConfirming(false),
    archive,
  };
}
