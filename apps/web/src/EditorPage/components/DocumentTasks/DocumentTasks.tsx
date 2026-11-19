import type { Task } from '@colaboradocs/review-core';
import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import PlusIcon from '@/icons/PlusIcon';
import TaskRow from '@/TaskRow/TaskRow';
import styles from './DocumentTasks.module.css';

type Props = {
  /** Las tareas del documento (de todas las personas); null mientras se piden. */
  tasks: Task[] | null;
  /** El día de hoy (AAAA-MM-DD), para saber cuáles vencieron. */
  today: string;
  /** Un documento sin publicar todavía no admite tareas. */
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onToggle: (task: Task, done: boolean) => void;
  onDelete: (task: Task) => void;
};

/** Las tareas del documento: quién tiene qué y para cuándo. Se guardan al instante, aparte del borrador. */
export default function DocumentTasks(props: Props) {
  return (
    <section id="tareas" class={styles.section}>
      <h2 class={styles.title}>Tareas</h2>
      <p class={styles.hint}>
        Quién tiene que hacer qué para este documento y para cuándo. Cada
        persona las ve en «Mis tareas». Se guardan al instante: no dependen del
        borrador ni de publicar.
      </p>
      <Show
        when={props.tasks !== null}
        fallback={<p class={styles.hint}>Cargando…</p>}
      >
        <ul class={styles.list}>
          <For each={props.tasks ?? []}>
            {(task) => (
              <TaskRow
                task={task}
                today={props.today}
                assignee={
                  task.assigneeMunicipality
                    ? `${task.assigneeName} (${task.assigneeMunicipality})`
                    : task.assigneeName
                }
                onEdit={() => props.onEdit(task)}
                canDelete
                onToggle={(done) => props.onToggle(task, done)}
                onDelete={() => props.onDelete(task)}
              />
            )}
          </For>
        </ul>
      </Show>
      <Show
        when={props.canAdd}
        fallback={
          <p class={styles.hint}>
            Publica el documento para poder asignarle tareas.
          </p>
        }
      >
        <Button icon={PlusIcon} class={styles.add} onClick={props.onAdd}>
          Agregar tarea
        </Button>
      </Show>
    </section>
  );
}
