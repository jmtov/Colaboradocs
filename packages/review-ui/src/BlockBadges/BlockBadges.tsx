import { Show } from 'solid-js';
import CheckIcon from '../icons/CheckIcon';
import CommentIcon from '../icons/CommentIcon';
import styles from './BlockBadges.module.css';

type Props = {
  /** Cuántas personas dieron OK. */
  approvals: number;
  /** El revisor actual ya dio OK: se dice a los lectores de pantalla, sin cambiar el aspecto. */
  mine: boolean;
  /** Hilos sin resolver. */
  openThreads: number;
  onOpenApprovals: () => void;
  onOpenComments: () => void;
};

/** Las dos insignias de un bloque, cada una un botón: los OK y los hilos abiertos. */
export default function BlockBadges(props: Props) {
  return (
    <>
      <Show when={props.approvals > 0}>
        <button
          type="button"
          class={styles.pill}
          aria-label={`${props.approvals} OK${props.mine ? ' (incluido el tuyo)' : ''}: ver quién`}
          onClick={props.onOpenApprovals}
        >
          <CheckIcon class={styles.icon} />
          {props.approvals}
        </button>
      </Show>
      <Show when={props.openThreads > 0}>
        <button
          type="button"
          class={styles.pill}
          aria-label={`${props.openThreads} ${props.openThreads === 1 ? 'hilo abierto' : 'hilos abiertos'}: ver comentarios`}
          onClick={props.onOpenComments}
        >
          <CommentIcon class={styles.icon} />
          {props.openThreads} {props.openThreads === 1 ? 'hilo' : 'hilos'}
        </button>
      </Show>
    </>
  );
}
