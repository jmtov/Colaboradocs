import { Button } from '@colaboradocs/review-ui';
import { For, Match, Show, Switch } from 'solid-js';
import PlusIcon from '@/icons/PlusIcon';
import RefreshIcon from '@/icons/RefreshIcon';
import ListFilter from '@/ListFilter/ListFilter';
import TaskRow from '@/TaskRow/TaskRow';
import TasksSkeleton from './components/TasksSkeleton/TasksSkeleton';
import { useTasksTab } from './TasksTab.hooks';
import styles from './TasksTab.module.css';
import { GROUP_TITLES } from './tasks.utils';

/** El tab «Tareas»: lo que tienes pendiente en todos los documentos, con filtro por documento. */
export default function TasksTab() {
  const page = useTasksTab();

  return (
    <div class={styles.content}>
      <ListFilter
        summary={
          page.visibleCount() === page.totalCount()
            ? null
            : `${page.visibleCount()} de ${page.totalCount()}`
        }
        placeholder="Buscar tareas"
        query={page.query()}
        onQuery={page.setQuery}
        canFilter={page.filterOptions().length > 1}
        onOpenFilters={() => void page.openFilters()}
        activeLabel={page.activeLabel()}
        onClear={() => page.clearFilter()}
      >
        <Button icon={PlusIcon} variant="primary" onClick={page.startNew}>
          Nueva tarea
        </Button>
      </ListFilter>
      <Switch>
        <Match when={page.status() === 'loading'}>
          <TasksSkeleton />
        </Match>
        <Match when={page.status() === 'error'}>
          <div class={styles.empty}>
            <p>No se pudieron cargar tus tareas.</p>
            <Button icon={RefreshIcon} onClick={page.retry}>
              Reintentar
            </Button>
          </div>
        </Match>
        <Match when={page.groups().length === 0}>
          <p class={styles.empty}>
            <Show
              when={page.hasAny()}
              fallback="No tienes tareas. Crea una con «Nueva tarea»."
            >
              Ninguna tarea coincide.{' '}
              <button
                type="button"
                class={styles.clearFilter}
                onClick={page.clearFilter}
              >
                Quitar el filtro
              </button>
            </Show>
          </p>
        </Match>
        <Match when={true}>
          <For each={page.groups()}>
            {(group) => (
              <section class={styles.group}>
                <h2 class={styles.groupTitle}>
                  {GROUP_TITLES[group.key]}
                  <span class={styles.count}>{group.tasks.length}</span>
                </h2>
                <ul class={styles.list}>
                  <For each={group.tasks}>
                    {(task) => (
                      <TaskRow
                        task={task}
                        today={page.today()}
                        onEdit={
                          page.canChange(task)
                            ? () => page.edit(task)
                            : undefined
                        }
                        onToggle={(done) => page.toggle(task, done)}
                        onDelete={
                          page.canChange(task)
                            ? () => page.remove(task)
                            : undefined
                        }
                        onOpenDocument={page.openDocument}
                      />
                    )}
                  </For>
                </ul>
              </section>
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}
