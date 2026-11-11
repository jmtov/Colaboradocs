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
  navigate,
  navigationKind,
  pathname,
  resolveRoute,
} from '@/router/router';

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
export function useHomeRoute() {
  const review = useReview();
  const single = () => {
    const list = review.documents();
    return list?.length === 1 ? list[0] : undefined;
  };
  createEffect(() => {
    const only = single();
    if (only) navigate(documentPath(only.id), { replace: true });
  });

  return { documents: () => review.documents(), single };
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
    instant: () => navigationKind() === 'replace',
    onSwap: () => window.scrollTo(0, 0),
  });
  const route = createMemo(() => resolveRoute(displayed()));
  const documentId = () => {
    const current = route();
    return current.kind === 'document' ? current.id : undefined;
  };

  const adminPage = () => {
    const current = route();
    return current.kind === 'admin' ? current.page : undefined;
  };

  return { refs, space, name, phase, route, documentId, adminPage };
}
