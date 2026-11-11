import { BottomSheet } from '@juntanza/review-ui';
import { Show } from 'solid-js';
import { useHowToReview } from './HowToReview.hooks';
import styles from './HowToReview.module.css';

export { HOWTO_OPEN_DELAY_MS } from './HowToReview.constants';

/**
 * La guía «Cómo revisar», en una hoja inferior. Se abre cada vez que se abre un
 * documento, hasta que se elige «No volver a mostrar»; después solo se abre a
 * pedido, desde el menú de la sesión.
 */
export default function HowToReview() {
  const howTo = useHowToReview();

  return (
    <BottomSheet
      open={howTo.open()}
      kicker="Guía"
      title="Cómo revisar"
      compact
      onClose={howTo.close}
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
          <Show when={!howTo.dismissed()}>
            <button
              type="button"
              class={styles.button}
              onClick={howTo.neverAgain}
            >
              No volver a mostrar
            </button>
          </Show>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            onClick={howTo.close}
          >
            Entendido
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
