import ArrowLeftIcon from '@/icons/ArrowLeftIcon';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import CloseIcon from '@/icons/CloseIcon';
import styles from './NavigationBar.module.css';

type Props = {
  title: string;
  /** Posición del bloque actual, desde 0. */
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

/** Barra inferior para ir de un bloque al siguiente (o anterior) del recorrido. */
export default function NavigationBar(props: Props) {
  return (
    <section class={styles.bar} aria-label={props.title}>
      <h2 class={styles.title}>{props.title}</h2>
      <p class={styles.counter} aria-live="polite">
        {props.index + 1} / {props.total}
      </p>
      <div class={styles.actions}>
        <button
          type="button"
          class={styles.button}
          data-flat
          aria-label="Anterior"
          onClick={props.onPrevious}
        >
          <ArrowLeftIcon class={styles.icon} />
        </button>
        <button
          type="button"
          class={styles.button}
          data-flat
          aria-label="Siguiente"
          onClick={props.onNext}
        >
          <ArrowRightIcon class={styles.icon} />
        </button>
        <button
          type="button"
          class={styles.button}
          data-flat
          aria-label="Cerrar"
          onClick={props.onClose}
        >
          <CloseIcon class={styles.icon} />
        </button>
      </div>
    </section>
  );
}
