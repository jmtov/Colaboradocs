import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import PlusIcon from '@/icons/PlusIcon';
import TaskRow from '@/TaskRow/TaskRow';
import { useDocumentTaskList } from './DocumentTaskList.hooks';
import styles from './DocumentTaskList.module.css';

type Props = {
  documentId: string;
};

/** Las tareas de este documento al pie del texto: quién tiene qué y para cuándo. Se crean y editan aquí, sin modo edición. */
export default function DocumentTaskList(props: Props) {
  const list = useDocumentTaskList(() => props.documentId);

  return (
    <section id="tareas" class={styles.section}>
      <h2 class={styles.title}>Tareas</h2>
      <p class={styles.hint}>
        Quién tiene que hacer qué para este documento y para cuándo. Cada
        persona marca las suyas.
      </p>
      <Show when={list.tasks().length > 0}>
        <ul class={styles.list}>
          <For each={list.tasks()}>
            {(task) => (
              <TaskRow
                task={task}
                today={list.today()}
                assignee={
                  task.assigneeMunicipality
                    ? `${task.assigneeName} (${task.assigneeMunicipality})`
                    : task.assigneeName
                }
                canToggle={list.canToggle(task)}
                onToggle={(done) => list.toggle(task, done)}
                onEdit={
                  list.canChange(task) ? () => list.edit(task) : undefined
                }
                onDelete={
                  list.canChange(task) ? () => list.remove(task) : undefined
                }
              />
            )}
          </For>
        </ul>
      </Show>
      <Button icon={PlusIcon} class={styles.add} onClick={list.add}>
        Nueva tarea
      </Button>
    </section>
  );
}
