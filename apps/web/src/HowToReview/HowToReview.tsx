import { BottomSheet } from '@juntanza/review-ui';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import styles from './HowToReview.module.css';
import { howToOpen, setHowToAvailable, setHowToOpen } from './howto.state';
import { dismissHowTo, isHowToDismissed } from './howto.utils';

/** Cuánto se espera, tras entrar a un documento, antes de abrir la guía. */
export const HOWTO_OPEN_DELAY_MS = 100;

/**
 * La guía «Cómo revisar», en una hoja inferior. Se abre cada vez que se abre un
 * documento, hasta que se elige «No volver a mostrar»; después solo se abre a
 * pedido, desde el menú de la sesión.
 */
export default function HowToReview() {
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

  return (
    <BottomSheet
      open={howToOpen()}
      kicker="Guía"
      title="Cómo revisar"
      compact
      onClose={() => setHowToOpen(false)}
    >
      <div class={styles.content}>
        <ol class={styles.steps}>
          <li class={styles.step}>
            <b class={styles.number}>01</b>
            <span>
              Toca un párrafo o una viñeta: aparece la barra para{' '}
              <strong>Comentar</strong> o dar tu <strong>OK</strong>.
            </span>
          </li>
          <li class={styles.step}>
            <b class={styles.number}>02</b>
            <span>
              Cada comentario abre un hilo: puedes <strong>responder</strong> a
              los de los demás.
            </span>
          </li>
          <li class={styles.step}>
            <b class={styles.number}>03</b>
            <span>
              Toca el encabezado de arriba para ver el contenido y saltar a una
              sección.
            </span>
          </li>
        </ol>
        <div class={styles.row}>
          <Show when={!dismissed()}>
            <button type="button" class={styles.button} onClick={neverAgain}>
              No volver a mostrar
            </button>
          </Show>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            onClick={() => setHowToOpen(false)}
          >
            Entendido
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
