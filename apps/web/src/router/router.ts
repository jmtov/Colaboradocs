import { createSignal } from 'solid-js';

/** Páginas de administración (solo admins). */
export type AdminPageName = 'documents' | 'access';

const ADMIN_PATHS: Record<AdminPageName, string> = {
  documents: '/documentos',
  access: '/accesos',
};

/** «Mis tareas»: las de quien entró, en todos los documentos. */
export const TASKS_PATH = '/tareas';

/** La lista de presentaciones: un tab de la home, junto a los documentos (`/`) y las tareas. */
export const DECKS_PATH = '/presentaciones';

/** Los tabs de la home. */
export type HomeTab = 'documents' | 'decks' | 'tasks';

export type Route =
  | { kind: 'home' }
  | { kind: 'decks' }
  | { kind: 'document'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'deck'; id: string }
  | { kind: 'deck-edit'; id: string }
  | { kind: 'tasks' }
  | { kind: 'admin'; page: AdminPageName }
  | { kind: 'missing' };

/** `/` es la home (los documentos), `/presentaciones` y `/tareas` sus otros dos tabs, `/d/<id>` un documento, `/d/<id>/editar` su editor, `/p/<id>` una presentación y `/p/<id>/editar` su editor y `/documentos` y `/accesos` la administración. Lo demás no existe. */
export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };
  if (path === TASKS_PATH) return { kind: 'tasks' };
  if (path === DECKS_PATH) return { kind: 'decks' };
  for (const [page, adminPath] of Object.entries(ADMIN_PATHS)) {
    if (path === adminPath)
      return { kind: 'admin', page: page as AdminPageName };
  }
  const deck = /^\/p\/([^/]+)(\/editar)?$/.exec(path);
  if (deck) {
    try {
      const id = decodeURIComponent(deck[1] ?? '');
      return deck[2] ? { kind: 'deck-edit', id } : { kind: 'deck', id };
    } catch {
      return { kind: 'missing' };
    }
  }
  const match = /^\/d\/([^/]+)(\/editar)?$/.exec(path);
  if (!match) return { kind: 'missing' };
  try {
    const id = decodeURIComponent(match[1] ?? '');
    return match[2] ? { kind: 'edit', id } : { kind: 'document', id };
  } catch {
    return { kind: 'missing' };
  }
}

export function adminPath(page: AdminPageName): string {
  return ADMIN_PATHS[page];
}

export function documentPath(id: string): string {
  return `/d/${encodeURIComponent(id)}`;
}

/** Una presentación. */
export function deckPath(id: string): string {
  return `/p/${encodeURIComponent(id)}`;
}

/** El editor de una presentación (solo admins). */
export function deckEditPath(id: string): string {
  return `${deckPath(id)}/editar`;
}

/** El editor de un documento (solo admins). */
export function editPath(id: string): string {
  return `${documentPath(id)}/editar`;
}

/**
 * Cómo se llegó a la ruta actual: la transición de página no anima las redirecciones (`replace`)
 * ni el cambio de tab (`tab`, que sí deja entrada en el historial).
 */
export type NavigationKind = 'push' | 'replace' | 'tab' | 'pop';

const [pathname, setPathname] = createSignal(window.location.pathname);
const [navigationKind, setNavigationKind] = createSignal<NavigationKind>('pop');
window.addEventListener('popstate', () => {
  setNavigationKind('pop');
  setPathname(window.location.pathname);
});

export { navigationKind, pathname };

/** Si llegar así a la ruta se muestra sin la transición de página: las redirecciones y el cambio de tab. */
export function skipsPageTransition(kind: NavigationKind): boolean {
  return kind === 'replace' || kind === 'tab';
}

function navigationKindOf(options: {
  replace?: boolean;
  tab?: boolean;
}): NavigationKind {
  if (options.replace) return 'replace';
  if (options.tab) return 'tab';
  return 'push';
}

/**
 * Va a otra ruta sin recargar. Con `replace` no deja entrada en el historial
 * (redirecciones). No desplaza la página: eso lo hace la transición de página
 * cuando cambia el contenido (si no, la página que sale saltaría arriba mientras se desvanece).
 */
export function navigate(
  to: string,
  options: { replace?: boolean; tab?: boolean } = {},
) {
  if (to === window.location.pathname) return;
  if (options.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  setNavigationKind(navigationKindOf(options));
  setPathname(window.location.pathname);
}
