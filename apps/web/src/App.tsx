import {
  ApiRequestError,
  fetchSpace,
  PinGate,
  ReviewProvider,
  useReview,
} from '@juntanza/review-ui';
import {
  createEffect,
  createMemo,
  createResource,
  Match,
  Show,
  Switch,
} from 'solid-js';
import type { SpaceInfo } from '@/content/content.types';
import DocumentPage from '@/DocumentPage/DocumentPage';
import DocumentsSheet from '@/DocumentsSheet/DocumentsSheet';
import HomePage from '@/HomePage/HomePage';
import Loading from '@/Loading/Loading';
import Link from '@/router/Link';
import { createPageTransition } from '@/router/pageTransition';
import {
  documentPath,
  navigate,
  navigationKind,
  pathname,
  resolveRoute,
} from '@/router/router';
import styles from './App.module.css';

const DEFAULT_SPACE: SpaceInfo = { name: 'Documentos' };

/** Duración de la transición de página según el CSS (0 con «reducir movimiento» o sin elemento). */
function transitionMs(element: HTMLElement | undefined): number {
  if (!element) return 0;
  const first =
    window
      .getComputedStyle(element)
      .transitionDuration?.split(',')[0]
      ?.trim() ?? '';
  const seconds = first.endsWith('ms')
    ? Number.parseFloat(first) / 1000
    : Number.parseFloat(first);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

/** Un documento: pide su contenido a la API al abrirlo. */
function DocumentRoute(props: { id: string }) {
  const review = useReview();
  const [content, { refetch }] = createResource(
    () => props.id,
    (id) => review.fetchContent(id),
  );
  const notFound = () => {
    const error: unknown = content.error;
    return error instanceof ApiRequestError && error.code === 'not_found';
  };

  return (
    <Switch>
      <Match when={content.error && notFound()}>
        <NotFound />
      </Match>
      <Match when={content.error}>
        <Loading>
          <h1>No se pudo cargar el documento</h1>
          <p>
            <button type="button" onClick={() => void refetch()}>
              Reintentar
            </button>
          </p>
        </Loading>
      </Match>
      <Match when={content()} keyed>
        {(document) => (
          <DocumentPage
            content={document}
            multiple={(review.documents()?.length ?? 0) > 1}
          />
        )}
      </Match>
      <Match when={content.loading}>
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
  const review = useReview();
  const single = () => {
    const list = review.documents();
    return list?.length === 1 ? list[0] : undefined;
  };
  createEffect(() => {
    const only = single();
    if (only) navigate(documentPath(only.id), { replace: true });
  });

  return (
    <Show
      when={review.documents() && !single()}
      fallback={<Loading>Cargando…</Loading>}
    >
      <HomePage
        name={props.name}
        description={props.description}
        documents={review.documents() ?? []}
      />
    </Show>
  );
}

export default function App() {
  const [space] = createResource(() => fetchSpace().catch(() => DEFAULT_SPACE));
  const name = () => space()?.name ?? DEFAULT_SPACE.name;
  createEffect(() => {
    document.title = name();
  });

  // La ruta que se muestra va un paso por detrás de la URL para poder animar la salida
  // de la página actual antes de mostrar la nueva (ver router/pageTransition.ts).
  let page: HTMLDivElement | undefined;
  const { displayed, phase } = createPageTransition({
    path: pathname,
    duration: () => transitionMs(page),
    // Las redirecciones (p. ej. `/` al único documento) no se animan: serían espera de más.
    instant: () => navigationKind() === 'replace',
    onSwap: () => window.scrollTo(0, 0),
  });
  const route = createMemo(() => resolveRoute(displayed()));
  const documentId = () => {
    const current = route();
    return current.kind === 'document' ? current.id : undefined;
  };

  return (
    <ReviewProvider documentId={documentId()} roleField={space()?.roleField}>
      <PinGate title={name()}>
        <div ref={page} class={styles.page} data-phase={phase()}>
          <Switch>
            <Match when={route().kind === 'home'}>
              <HomeRoute name={name()} description={space()?.description} />
            </Match>
            <Match when={documentId()} keyed>
              {/* keyed: al cambiar de documento se vuelve a pedir y armar todo */}
              {(id) => <DocumentRoute id={id} />}
            </Match>
            <Match when={route().kind === 'missing'}>
              <NotFound />
            </Match>
          </Switch>
        </div>
        <DocumentsSheet />
      </PinGate>
    </ReviewProvider>
  );
}
