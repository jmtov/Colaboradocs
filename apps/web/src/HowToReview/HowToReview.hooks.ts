import { createSignal, onCleanup, onMount } from 'solid-js';
import { HOWTO_OPEN_DELAY_MS } from './HowToReview.constants';
import { howToOpen, setHowToAvailable, setHowToOpen } from './howto.state';
import { dismissHowTo, isHowToDismissed } from './howto.utils';

/** Estado de la guía: se abre sola al entrar al documento, salvo que se haya descartado. */
export function useHowToReview() {
  const [dismissed, setDismissed] = createSignal(isHowToDismissed());

  let openTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    setHowToAvailable(true);
    // Un instante después de entrar al documento: así la hoja se desliza sobre una
    // página ya pintada, en vez de competir con su carga.
    if (!dismissed()) {
      openTimer = setTimeout(() => setHowToOpen(true), HOWTO_OPEN_DELAY_MS);
    }
  });
  onCleanup(() => {
    clearTimeout(openTimer);
    setHowToAvailable(false);
    setHowToOpen(false);
  });

  function neverAgain() {
    dismissHowTo();
    setDismissed(true);
    setHowToOpen(false);
  }

  function close() {
    setHowToOpen(false);
  }

  return { open: howToOpen, dismissed, neverAgain, close };
}
