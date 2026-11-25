import type { DeckListItem } from '@colaboradocs/deck-core';
import type { DocumentListItem } from '@colaboradocs/review-core';
import { Match, Switch } from 'solid-js';
import TasksTab from '@/home/HomePage/components/TasksTab/TasksTab';
import HomeShell from '@/home/HomeShell/HomeShell';
import type { HomeTab } from '@/shared/router/router';
import DecksTab from './components/DecksTab/DecksTab';
import DocumentsTab from './components/DocumentsTab/DocumentsTab';
import { useHomePage, useTabContent } from './HomePage.hooks';
import styles from './HomePage.module.css';

type Props = {
  name: string;
  /** Qué tab se muestra: documentos, presentaciones o tareas. */
  tab: HomeTab;
  documents: DocumentListItem[];
  decks: DeckListItem[];
  /** Tras archivar una presentación: volver a pedir la lista. */
  onDecksChange?: () => void;
};

/** La home: el marco con los tabs y, debajo, la lista del tab que toca. */
export default function HomePage(props: Props) {
  const home = useHomePage();
  const content = useTabContent(() => props.tab);

  return (
    <HomeShell
      name={props.name}
      tab={props.tab}
      counts={{
        documents: props.documents.length,
        decks: props.decks.length,
        tasks: home.pendingTasks(),
      }}
      alwaysShowDecks={home.isAdmin()}
      offline={home.offline()}
    >
      <div
        ref={content.refs.content}
        class={styles.content}
        data-phase={content.phase()}
        data-dir={content.direction() === 1 ? 'forward' : 'back'}
      >
        <Switch>
          <Match when={content.shown() === 'documents'}>
            <DocumentsTab
              documents={props.documents}
              isAdmin={home.isAdmin()}
            />
          </Match>
          <Match when={content.shown() === 'decks'}>
            <DecksTab
              decks={props.decks}
              isAdmin={home.isAdmin()}
              onChange={() => props.onDecksChange?.()}
            />
          </Match>
          <Match when={content.shown() === 'tasks'}>
            <TasksTab />
          </Match>
        </Switch>
      </div>
    </HomeShell>
  );
}
