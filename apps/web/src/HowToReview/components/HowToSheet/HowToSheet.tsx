import {
  BottomSheet,
  Button,
  type SheetLayerProps,
} from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import { useHowToSheet } from './HowToSheet.hooks';
import styles from './HowToSheet.module.css';

/**
 * La guía «Cómo revisar», en una hoja inferior. Se abre sola cada vez que se abre un
 * documento, hasta que se elige «No volver a mostrar»; después solo se abre a
 * pedido, desde el menú de la sesión.
 */
export default function HowToSheet(props: SheetLayerProps) {
  const howTo = useHowToSheet({ close: () => props.close() });

  return (
    <BottomSheet
      open={props.open}
      kicker="Guía"
      title="Cómo revisar"
      compact
      onClose={props.onClose}
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
            <Button icon={CloseIcon} onClick={howTo.neverAgain}>
              No volver a mostrar
            </Button>
          </Show>
          <Button icon={CheckIcon} variant="primary" onClick={howTo.close}>
            Entendido
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
