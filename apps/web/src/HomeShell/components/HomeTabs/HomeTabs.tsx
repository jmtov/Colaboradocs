import { For, Show } from 'solid-js';
import Link from '@/router/Link';
import { DECKS_PATH, type HomeTab, TASKS_PATH } from '@/router/router';
import { useTabIndicator } from './HomeTabs.hooks';
import styles from './HomeTabs.module.css';

type Props = {
  tab: HomeTab;
  counts: { documents: number; decks: number; tasks: number | null };
  /** Sin presentaciones que mostrar (y sin poder crearlas), el tab no aparece. */
  showDecks: boolean;
};

/** Los tabs de la home: son enlaces a rutas (`/`, `/presentaciones`, `/tareas`), así que atrás, recargar y compartir funcionan. */
export default function HomeTabs(props: Props) {
  const tabs = () => {
    const all: {
      tab: HomeTab;
      label: string;
      href: string;
      count: number | null;
    }[] = [
      {
        tab: 'documents',
        label: 'Documentos',
        href: '/',
        count: props.counts.documents,
      },
      {
        tab: 'decks',
        label: 'Presentaciones',
        href: DECKS_PATH,
        count: props.counts.decks,
      },
      {
        tab: 'tasks',
        label: 'Tareas',
        href: TASKS_PATH,
        count: props.counts.tasks,
      },
    ];
    return props.showDecks ? all : all.filter((entry) => entry.tab !== 'decks');
  };

  const indicator = useTabIndicator(() => [
    props.tab,
    props.counts,
    props.showDecks,
  ]);

  return (
    <nav class={styles.tabs} aria-label="Secciones" ref={indicator.setNav}>
      <For each={tabs()}>
        {(entry) => (
          <Link
            tab
            href={entry.href}
            class={styles.tab}
            aria-current={props.tab === entry.tab ? 'page' : undefined}
          >
            {entry.label}
            <Show when={entry.count !== null}>
              <span class={styles.count}>{entry.count}</span>
            </Show>
          </Link>
        )}
      </For>
      <span class={styles.indicator} aria-hidden="true" />
    </nav>
  );
}
