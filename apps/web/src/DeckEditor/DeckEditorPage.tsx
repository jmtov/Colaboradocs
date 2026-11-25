import { Button } from '@colaboradocs/review-ui';
import { Match, Switch } from 'solid-js';
import RefreshIcon from '@/icons/RefreshIcon';
import Loading from '@/Loading/Loading';
import './editor.css';
import { useDeckEditorPage } from './DeckEditorPage.hooks';
import styles from './DeckEditorPage.module.css';
import DeckEditorSkeleton from './DeckEditorSkeleton/DeckEditorSkeleton';
import Preview from './features/preview/Preview';
import SlideList from './features/slide-list/SlideList';
import SlidePanel from './features/slide-panel/SlidePanel';
import Toolbar from './features/toolbar/Toolbar';
import { useLockPageScroll } from './features/ui/pageScroll.hooks';
import { useScrolling } from './features/ui/scrolling.hooks';

/** El editor de una presentación (solo admins): lista de slides, vista previa en vivo y panel de campos. */
export default function DeckEditorPage(props: { id: string }) {
  const page = useDeckEditorPage(() => props.id);
  const scroll = useScrolling();
  useLockPageScroll();

  return (
    <Switch>
      <Match when={page.opened.error && page.notFound()}>
        <Loading>
          <h1>No encontramos esa presentación</h1>
        </Loading>
      </Match>
      <Match when={page.opened.error}>
        <Loading>
          <h1>No se pudo abrir el editor</h1>
          <p>
            <Button icon={RefreshIcon} onClick={() => void page.refetch()}>
              Reintentar
            </Button>
          </p>
        </Loading>
      </Match>
      <Match when={page.opened()}>
        <div class={styles.app} data-deck-editor>
          <header class={styles.toolbar} data-app-toolbar>
            <Toolbar actions={page.actions} />
          </header>
          <aside class={styles.list}>
            <SlideList />
          </aside>
          <main class={styles.preview}>
            <Preview />
          </main>
          <aside
            class={styles.panel}
            classList={{ [styles.scrolling]: scroll.scrolling() }}
            onScroll={scroll.onScroll}
          >
            <SlidePanel />
          </aside>
        </div>
      </Match>
      <Match when={page.opened.loading}>
        <DeckEditorSkeleton />
      </Match>
    </Switch>
  );
}
