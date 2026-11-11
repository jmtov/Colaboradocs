import { useOverlay } from '@juntanza/review-ui';
import { onCleanup, onMount } from 'solid-js';
import HowToSheet from './components/HowToSheet/HowToSheet';
import { HOWTO_OPEN_DELAY_MS } from './HowToReview.constants';
import { setHowToAvailable } from './howto.state';
import { isHowToDismissed } from './howto.utils';

/** Abre la guía sola al entrar al documento, salvo que se haya descartado. */
export function useHowToReview() {
  const overlay = useOverlay();
  let openTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    setHowToAvailable(true);
    // Un instante después de entrar al documento: así la hoja se desliza sobre una
    // página ya pintada, en vez de competir con su carga.
    if (!isHowToDismissed()) {
      openTimer = setTimeout(
        () => void overlay.sheet(HowToSheet, {}),
        HOWTO_OPEN_DELAY_MS,
      );
    }
  });
  onCleanup(() => {
    clearTimeout(openTimer);
    setHowToAvailable(false);
  });
}
