import {
  ApiRequestError,
  fetchSpace,
  useReview,
} from '@colaboradocs/review-ui';
import { createEffect, createMemo, createResource } from 'solid-js';
import type { SpaceInfo } from '@/content/content.types';
import { createPageTransition } from '@/router/pageTransition';
import {
  documentPath,
  type HomeTab,
  navigate,
  navigationKind,
  pathname,
  resolveRoute,
  skipsPageTransition,
} from '@/router/router';
import { transitionMs } from './router/transition.utils';

const DEFAULT_SPACE: SpaceInfo = { name: 'Documentos' };

/** Estado de la ruta de un documento: pide su contenido a la API al abrirlo. */
export function useDocumentRoute(id: () => string) {
  const review = useReview();
  const [content, { refetch }] = createResource(id, (next) =>
    review.fetchContent(next),
  );
  const notFound = () => {
    const error: unknown = content.error;
    return error instanceof ApiRequestError && error.code === 'not_found';
  };
  const multiple = () => (review.documents()?.length ?? 0) > 1;

  return { content, refetch, notFound, multiple };
}

/** La home. Con un solo documento no hay nada que elegir: va directo a él. */
/** La lista de la home. Con un solo documento (y sin presentaciones) la ruta `/` va directo a él, salvo para admins; los otros tabs no. */
export function useHomeRoute(tab: () => HomeTab) {
  const review = useReview();
  // Sin presentaciones que mostrar; si falla la lista (un servidor sin decks), es como no tener.
  const [decks, { refetch: refetchDecks }] = createResource(() =>
    review.fetchDecks().catch(() => []),
  );
  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;
  const single = () => {
    const list = review.documents();
    // Quien administra ve la home aunque haya un solo documento: ahí crea y sube lo demás.
    return !isAdmin() &&
      tab() === 'documents' &&
      list?.length === 1 &&
      decks()?.length === 0
      ? list[0]
      : undefined;
  };
  createEffect(() => {
    const only = single();
    if (only) navigate(documentPath(only.id), { replace: true });
  });

  return {
    documents: () => review.documents(),
    failed: () => review.status() === 'error' && !review.documents(),
    retry: () => void review.refresh(),
    decks,
    refetchDecks,
    single,
  };
}

/** Estado de la app: espacio, título del documento, transición de páginas y ruta. */
export function useApp() {
  const [space] = createResource(() => fetchSpace().catch(() => DEFAULT_SPACE));
  const name = () => space()?.name ?? DEFAULT_SPACE.name;
  createEffect(() => {
    document.title = name();
  });

  // La ruta que se muestra va un paso por detrás de la URL para poder animar la salida
  // de la página actual antes de mostrar la nueva (ver router/pageTransition.ts).
  const refs = {} as { page: HTMLDivElement };
  const { displayed, phase } = createPageTransition({
    path: pathname,
    duration: () => transitionMs(refs.page),
    // Las redirecciones (p. ej. `/` al único documento) no se animan: serían espera de más.
    instant: () => skipsPageTransition(navigationKind()),
    onSwap: () => window.scrollTo(0, 0),
  });
  const route = createMemo(() => resolveRoute(displayed()));
  // El documento de la ruta, para leerlo o para editarlo: la revisión es la misma.
  const documentId = () => {
    const current = route();
    return current.kind === 'document' || current.kind === 'edit'
      ? current.id
      : undefined;
  };
  const viewId = () => {
    const current = route();
    return current.kind === 'document' ? current.id : undefined;
  };
  const editId = () => {
    const current = route();
    return current.kind === 'edit' ? current.id : undefined;
  };

  /** Qué tab de la home se muestra (documentos, presentaciones o tareas), si la ruta es una de ellas. */
  const homeTab = (): HomeTab | undefined => {
    switch (route().kind) {
      case 'home':
        return 'documents';
      case 'decks':
        return 'decks';
      case 'tasks':
        return 'tasks';
      default:
        return undefined;
    }
  };

  const deckId = () => {
    const current = route();
    return current.kind === 'deck' ? current.id : undefined;
  };

  const deckEditId = () => {
    const current = route();
    return current.kind === 'deck-edit' ? current.id : undefined;
  };

  const adminPage = () => {
    const current = route();
    return current.kind === 'admin' ? current.page : undefined;
  };

  return {
    refs,
    space,
    name,
    phase,
    route,
    documentId,
    viewId,
    editId,
    deckId,
    deckEditId,
    adminPage,
    homeTab,
  };
}
