import { createSignal } from 'solid-js';

/** Páginas de administración (solo admins). */
export type AdminPageName = 'documents' | 'access';

const ADMIN_PATHS: Record<AdminPageName, string> = {
  documents: '/documentos',
  access: '/accesos',
};

export type Route =
  | { kind: 'home' }
  | { kind: 'document'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'admin'; page: AdminPageName }
  | { kind: 'missing' };

/** `/` es la home, `/d/<id>` un documento, `/d/<id>/editar` su editor y `/documentos` y `/accesos` la administración. Lo demás no existe. */
export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };
  for (const [page, adminPath] of Object.entries(ADMIN_PATHS)) {
    if (path === adminPath)
      return { kind: 'admin', page: page as AdminPageName };
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

/** El editor de un documento (solo admins). */
export function editPath(id: string): string {
  return `${documentPath(id)}/editar`;
}

/** Cómo se llegó a la ruta actual: la transición de página no anima las redirecciones. */
export type NavigationKind = 'push' | 'replace' | 'pop';

const [pathname, setPathname] = createSignal(window.location.pathname);
const [navigationKind, setNavigationKind] = createSignal<NavigationKind>('pop');
window.addEventListener('popstate', () => {
  setNavigationKind('pop');
  setPathname(window.location.pathname);
});

export { navigationKind, pathname };

/**
 * Va a otra ruta sin recargar. Con `replace` no deja entrada en el historial
 * (redirecciones). No desplaza la página: eso lo hace la transición de página
 * cuando cambia el contenido (si no, la página que sale saltaría arriba mientras se desvanece).
 */
export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (to === window.location.pathname) return;
  if (options.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  setNavigationKind(options.replace ? 'replace' : 'push');
  setPathname(window.location.pathname);
}
