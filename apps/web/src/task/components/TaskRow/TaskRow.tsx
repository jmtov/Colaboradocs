import { dueState, type Task } from '@colaboradocs/review-core';
import CheckIcon from 'lucide-solid/icons/check';
import { Show } from 'solid-js';
import TaskMenu from '@/task/components/TaskMenu/TaskMenu';
import styles from './TaskRow.module.css';
import { dueLabel, formatDueDate } from './task.utils';

type Props = {
  task: Task;
  /** El día de hoy (AAAA-MM-DD), para saber si venció. */
  today: string;
  /** Quién la tiene (nombre y, si hay, municipio): se muestra en las listas de varias personas. */
  assignee?: string;
  /** Sin esto no hay «Editar» en el menú. */
  onEdit?: () => void;
  /** Sin esto no hay «Eliminar» en el menú. */
  onDelete?: () => void;
  /** Si quien mira puede marcarla; por defecto sí. Sin permiso, el botón se ve pero no responde. */
  canToggle?: boolean;
  onToggle: (done: boolean) => void;
  /** Sin esto, el documento no se muestra (ya se está en él). */
  onOpenDocument?: (documentId: string) => void;
};

/** Una tarea en la lista: se marca hecha con el botón de la izquierda. */
export default function TaskRow(props: Props) {
  const state = () => dueState(props.task, props.today);
  const done = () => props.task.doneAt !== null;
  const label = () => dueLabel(state());

  return (
    <li class={styles.row} data-state={state()}>
      <button
        type="button"
        class={styles.check}
        aria-pressed={done()}
        disabled={props.canToggle === false}
        aria-label={done() ? 'Reabrir la tarea' : 'Marcar como hecha'}
        onClick={() => props.onToggle(!done())}
      >
        <Show when={done()}>
          <CheckIcon class={styles.mark} />
        </Show>
      </button>
      <div class={styles.body}>
        <span class={styles.title} classList={{ [styles.done]: done() }}>
          {props.task.title}
        </span>
        <span class={styles.meta}>
          <span class={styles.date}>{formatDueDate(props.task.dueDate)}</span>
          <Show when={props.assignee}>
            <span class={styles.assignee}>{props.assignee}</span>
          </Show>
          <Show when={label()}>
            <span class={styles.chip}>{label()}</span>
          </Show>
          <Show when={props.task.documentId && props.onOpenDocument}>
            <button
              type="button"
              class={styles.document}
              onClick={() =>
                props.onOpenDocument?.(props.task.documentId ?? '')
              }
            >
              {props.task.documentTitle ?? props.task.documentId}
            </button>
          </Show>
        </span>
      </div>
      <Show when={props.onEdit || props.onDelete}>
        <TaskMenu
          title={props.task.title}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />
      </Show>
    </li>
  );
}
