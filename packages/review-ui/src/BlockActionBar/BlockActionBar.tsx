import { Show } from 'solid-js';
import CheckIcon from '../icons/CheckIcon';
import CloseIcon from '../icons/CloseIcon';
import CommentIcon from '../icons/CommentIcon';
import styles from './BlockActionBar.module.css';

type Props = {
  /** El revisor actual ya dio OK. */
  mine: boolean;
  /** Hilos sin resolver en este bloque. */
  openThreads: number;
  onComment: () => void;
  onToggleApproval: () => void;
  onClose: () => void;
};

/** Barra con las acciones del bloque seleccionado; se monta justo debajo de él. */
export default function BlockActionBar(props: Props) {
  return (
    <div
      class={styles.bar}
      role="toolbar"
      aria-label="Acciones del párrafo"
      data-review-bar
    >
      <button type="button" class={styles.button} onClick={props.onComment}>
        <CommentIcon class={styles.icon} />
        Comentar
        <Show when={props.openThreads > 0}> ({props.openThreads})</Show>
      </button>
      <button
        type="button"
        class={styles.button}
        classList={{ [styles.on]: props.mine }}
        aria-pressed={props.mine}
        onClick={props.onToggleApproval}
      >
        <CheckIcon class={styles.icon} />
        {props.mine ? 'Marcado OK' : 'OK'}
      </button>
      <button
        type="button"
        class={`${styles.button} ${styles.close}`}
        onClick={props.onClose}
      >
        <CloseIcon class={styles.icon} />
        Cerrar
      </button>
    </div>
  );
}
