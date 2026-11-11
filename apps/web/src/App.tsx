import { PinGate, ReviewProvider } from '@colaboradocs/review-ui';
import { Match, Show, Switch } from 'solid-js';
import AdminPage from '@/AdminPage/AdminPage';
import DocumentPage from '@/DocumentPage/DocumentPage';
import HomePage from '@/HomePage/HomePage';
import Loading from '@/Loading/Loading';
import Link from '@/router/Link';
import { useApp, useDocumentRoute, useHomeRoute } from './App.hooks';
import styles from './App.module.css';

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
            <button type="button" onClick={() => void route.refetch()}>
              Reintentar
            </button>
          </p>
        </Loading>
      </Match>
      <Match when={route.content()} keyed>
        {(document) => (
          <DocumentPage content={document} multiple={route.multiple()} />
        )}
      </Match>
      <Match when={route.content.loading}>
        <Loading>Cargando…</Loading>
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

/** La home. Con un solo documento no hay nada que elegir: va directo a él. */
function HomeRoute(props: { name: string; description?: string }) {
  const home = useHomeRoute();

  return (
    <Show
      when={home.documents() && !home.single()}
      fallback={<Loading>Cargando…</Loading>}
    >
      <HomePage
        name={props.name}
        description={props.description}
        documents={home.documents() ?? []}
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
            <Match when={app.route().kind === 'home'}>
              <HomeRoute
                name={app.name()}
                description={app.space()?.description}
              />
            </Match>
            <Match when={app.adminPage()} keyed>
              {(page) => <AdminPage name={app.name()} page={page} />}
            </Match>
            <Match when={app.documentId()} keyed>
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
