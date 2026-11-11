import { Show } from 'solid-js';
import Button from '../Button/Button';
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
      <Button icon={CommentIcon} onClick={props.onComment}>
        Comentar
        <Show when={props.openThreads > 0}> ({props.openThreads})</Show>
      </Button>
      <Button
        icon={CheckIcon}
        pressed={props.mine}
        onClick={props.onToggleApproval}
      >
        {props.mine ? 'Marcado OK' : 'OK'}
      </Button>
      <Button icon={CloseIcon} class={styles.close} onClick={props.onClose}>
        Cerrar
      </Button>
    </div>
  );
}
