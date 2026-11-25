import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import ChevronDownIcon from '@/shared/icons/ChevronDownIcon';
import PlusIcon from '@/shared/icons/PlusIcon';
import TaskRow from '@/task/components/TaskRow/TaskRow';
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
        <For each={list.groups()}>
          {(group) => (
            <div class={styles.group}>
              <h3 class={styles.groupTitle}>
                <button
                  type="button"
                  class={styles.groupToggle}
                  aria-expanded={!list.isCollapsed(group.id)}
                  onClick={() => list.toggleGroup(group.id)}
                >
                  <ChevronDownIcon
                    class={`${styles.chevron} ${list.isCollapsed(group.id) ? styles.chevronClosed : ''}`}
                  />
                  {list.isMe(group.id) ? `${group.name} (tú)` : group.name}
                  <span class={styles.count}>{group.tasks.length}</span>
                </button>
              </h3>
              <Show when={!list.isCollapsed(group.id)}>
                <ul class={styles.list}>
                  <For each={group.tasks}>
                    {(task) => (
                      <TaskRow
                        task={task}
                        today={list.today()}
                        canToggle={list.canToggle(task)}
                        onToggle={(done) => list.toggle(task, done)}
                        onEdit={
                          list.canChange(task)
                            ? () => list.edit(task)
                            : undefined
                        }
                        onDelete={
                          list.canChange(task)
                            ? () => list.remove(task)
                            : undefined
                        }
                      />
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          )}
        </For>
      </Show>
      <Button icon={PlusIcon} class={styles.add} onClick={list.add}>
        Nueva tarea
      </Button>
    </section>
  );
}
