import { createSignal } from 'solid-js';

export type Route =
  | { kind: 'home' }
  | { kind: 'document'; id: string }
  | { kind: 'missing' };

/** `/` es la home y `/d/<id>` un documento. Lo demás no existe. */
export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };
  const match = /^\/d\/([^/]+)$/.exec(path);
  if (!match) return { kind: 'missing' };
  try {
    return { kind: 'document', id: decodeURIComponent(match[1] ?? '') };
  } catch {
    return { kind: 'missing' };
  }
}

export function documentPath(id: string): string {
  return `/d/${encodeURIComponent(id)}`;
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
