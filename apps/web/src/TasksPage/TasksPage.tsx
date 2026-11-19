import { Button } from '@colaboradocs/review-ui';
import { For, Match, Show, Switch } from 'solid-js';
import PlusIcon from '@/icons/PlusIcon';
import RefreshIcon from '@/icons/RefreshIcon';
import PageBar from '@/PageBar/PageBar';
import TaskRow from '@/TaskRow/TaskRow';
import { useTasksPage } from './TasksPage.hooks';
import styles from './TasksPage.module.css';
import { GROUP_TITLES } from './tasks.utils';

type Props = {
  /** Nombre del espacio, en el encabezado. */
  name: string;
};

/** «Mis tareas»: lo que tienes pendiente en todos los documentos, con filtro por documento. */
export default function TasksPage(props: Props) {
  const page = useTasksPage();

  return (
    <>
      <PageBar backLabel="Inicio" backHref="/" name={props.name}>
        <Show when={page.offline()}>
          <span role="status">Sin conexión</span>
        </Show>
      </PageBar>
      <main class={styles.page}>
        <section class={styles.intro}>
          <span class={styles.eyebrow}>Tareas</span>
          <h1 class={styles.title}>Mis tareas</h1>
        </section>
        <div class={styles.content}>
          <div class={styles.tools}>
            <Button icon={PlusIcon} variant="primary" onClick={page.startNew}>
              Nueva tarea
            </Button>
            <Show when={page.filterOptions().length > 1}>
              <select
                class={styles.filter}
                aria-label="Filtrar por documento"
                value={page.documentFilter()}
                onChange={(event) =>
                  page.setDocumentFilter(event.currentTarget.value)
                }
              >
                <option value="">Todos los documentos</option>
                <For each={page.filterOptions()}>
                  {(option) => (
                    <option value={option.id}>{option.title}</option>
                  )}
                </For>
              </select>
            </Show>
          </div>
          <Switch>
            <Match when={page.status() === 'loading'}>
              <p class={styles.empty}>Cargando tus tareas…</p>
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
                  Ninguna tarea de ese documento.
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
      </main>
    </>
  );
}
