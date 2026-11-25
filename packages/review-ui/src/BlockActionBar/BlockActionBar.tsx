import CheckIcon from 'lucide-solid/icons/check';
import CommentIcon from 'lucide-solid/icons/message-circle';
import CloseIcon from 'lucide-solid/icons/x';
import { Show } from 'solid-js';
import Button from '../Button/Button';
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
        variant={props.mine ? 'ok' : 'default'}
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
