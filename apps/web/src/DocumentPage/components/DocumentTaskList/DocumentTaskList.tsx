import { For, Show } from 'solid-js';
import TaskRow from '@/TaskRow/TaskRow';
import { useDocumentTaskList } from './DocumentTaskList.hooks';
import styles from './DocumentTaskList.module.css';

type Props = {
  documentId: string;
};

/** Las tareas de este documento al pie del texto: quién tiene qué y para cuándo. Sin tareas, no se muestra. */
export default function DocumentTaskList(props: Props) {
  const list = useDocumentTaskList(() => props.documentId);

  return (
    <Show when={list.tasks().length > 0}>
      <section id="tareas" class={styles.section}>
        <h2 class={styles.title}>Tareas</h2>
        <p class={styles.hint}>
          Quién tiene que hacer qué para este documento y para cuándo. Cada
          persona marca las suyas.
        </p>
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
                canDelete={false}
                onToggle={(done) => list.toggle(task, done)}
                onDelete={() => {}}
              />
            )}
          </For>
        </ul>
      </section>
    </Show>
  );
}
