import { Button, PinGate, ReviewProvider } from '@colaboradocs/review-ui';
import { lazy, Match, Show, Suspense, Switch } from 'solid-js';
import AdminPage from '@/admin/AdminPage/AdminPage';
import DeckEditorSkeleton from '@/deck/DeckEditorPage/DeckEditorSkeleton/DeckEditorSkeleton';
import DeckPage from '@/deck/DeckPage/DeckPage';
import DocumentPage from '@/document/DocumentPage/DocumentPage';
import DocumentSkeleton from '@/document/DocumentPage/DocumentSkeleton/DocumentSkeleton';
import EditorSkeleton from '@/document/EditorPage/EditorSkeleton/EditorSkeleton';
import HomeSkeleton from '@/home/HomePage/components/HomeSkeleton/HomeSkeleton';
import HomePage from '@/home/HomePage/HomePage';
import RefreshIcon from '@/shared/icons/RefreshIcon';
import Link from '@/shared/router/Link';
import type { HomeTab } from '@/shared/router/router';
import Loading from '@/shared/ui/Loading/Loading';
import { useApp, useDocumentRoute, useHomeRoute } from './App.hooks';
import styles from './App.module.css';

// Tiptap/ProseMirror (~350 kB) solo se descarga al abrir el editor.
const EditorPage = lazy(() => import('@/document/EditorPage/EditorPage'));
const DeckEditorPage = lazy(
  () => import('@/deck/DeckEditorPage/DeckEditorPage'),
);

/** Un documento: pide su contenido a la API al abrirlo. */
function DocumentRoute(props: { id: string }) {
  const route = useDocumentRoute(() => props.id);

  return (
    <Switch>
      <Match when={route.content.error && route.notFound()}>
        <NotFound />
      </Match>
      <Match when={route.content.error}>
        <Loading>
          <h1>No se pudo cargar el documento</h1>
          <p>
            <Button icon={RefreshIcon} onClick={() => void route.refetch()}>
              Reintentar
            </Button>
          </p>
        </Loading>
      </Match>
      <Match when={route.content()} keyed>
        {(document) => (
          <DocumentPage content={document} multiple={route.multiple()} />
        )}
      </Match>
      <Match when={route.content.loading}>
        <DocumentSkeleton />
      </Match>
    </Switch>
  );
}

function NotFound() {
  return (
    <Loading>
      <h1>No encontramos ese documento</h1>
      <p>
        <Link href="/">Ver todos los documentos</Link>
      </p>
    </Loading>
  );
}

/** La home (documentos, presentaciones o tareas, según el tab). Con un solo documento no hay nada que elegir: `/` va directo a él. */
function HomeRoute(props: { name: string; tab: HomeTab }) {
  const home = useHomeRoute(() => props.tab);

  return (
    <Show
      when={home.documents() && home.decks() && !home.single()}
      fallback={
        <Show when={home.failed()} fallback={<HomeSkeleton />}>
          <Loading>
            <h1>No se pudo cargar la lista</h1>
            <p>
              <Button icon={RefreshIcon} onClick={home.retry}>
                Reintentar
              </Button>
            </p>
          </Loading>
        </Show>
      }
    >
      <HomePage
        name={props.name}
        tab={props.tab}
        documents={home.documents() ?? []}
        decks={home.decks() ?? []}
        onDecksChange={() => void home.refetchDecks()}
      />
    </Show>
  );
}

export default function App() {
  const app = useApp();

  return (
    <ReviewProvider
      documentId={app.documentId()}
      roleField={app.space()?.roleField}
    >
      <PinGate title={app.name()}>
        <div ref={app.refs.page} class={styles.page} data-phase={app.phase()}>
          <Switch>
            <Match when={app.homeTab()}>
              {/* Sin `keyed`: cambiar de tab no vuelve a armar el marco, solo cambia el contenido. */}
              {(tab) => <HomeRoute name={app.name()} tab={tab()} />}
            </Match>
            <Match when={app.adminPage()} keyed>
              {(page) => <AdminPage name={app.name()} page={page} />}
            </Match>
            <Match when={app.editId()} keyed>
              {/* keyed: al cambiar de documento se vuelve a pedir y armar todo */}
              {(id) => (
                <Suspense fallback={<EditorSkeleton />}>
                  <EditorPage id={id} name={app.name()} />
                </Suspense>
              )}
            </Match>
            <Match when={app.deckEditId()} keyed>
              {(id) => (
                <Suspense fallback={<DeckEditorSkeleton />}>
                  <DeckEditorPage id={id} />
                </Suspense>
              )}
            </Match>
            <Match when={app.deckId()} keyed>
              {(id) => <DeckPage id={id} name={app.name()} />}
            </Match>
            <Match when={app.viewId()} keyed>
              {/* keyed: al cambiar de documento se vuelve a pedir y armar todo */}
              {(id) => <DocumentRoute id={id} />}
            </Match>
            <Match when={app.route().kind === 'missing'}>
              <NotFound />
            </Match>
          </Switch>
        </div>
      </PinGate>
    </ReviewProvider>
  );
}
