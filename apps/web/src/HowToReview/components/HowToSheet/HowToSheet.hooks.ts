import { createEffect, createSignal, on } from 'solid-js';
import { howToAvailable } from '@/HowToReview/howto.state';
import { dismissHowTo, isHowToDismissed } from '@/HowToReview/howto.utils';

/** Estado y acciones de la guía. Se monta al abrirse, así que lee «descartada» al abrir. */
export function useHowToSheet({ close }: { close: () => void }) {
  const [dismissed, setDismissed] = createSignal(isHowToDismissed());

  // Si se sale del documento con la guía abierta, se cierra: ya no hay nada que explicar.
  createEffect(
    on(
      howToAvailable,
      (available) => {
        if (!available) close();
      },
      { defer: true },
    ),
  );

  function neverAgain() {
    dismissHowTo();
    setDismissed(true);
    close();
  }

  return { dismissed, neverAgain, close };
}
