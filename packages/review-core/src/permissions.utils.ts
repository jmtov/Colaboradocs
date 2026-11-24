import type { Reviewer } from './review.types';

/**
 * Rutas de administración que también puede usar el agente: leer y guardar el
 * borrador de un documento o una presentación, y publicar un documento (la ruta
 * pone además sus condiciones: solo un borrador cuyo último guardado fue suyo).
 */
const AGENT_ADMIN_ROUTES: { methods: string[]; pattern: RegExp }[] = [
  {
    methods: ['GET', 'PUT'],
    pattern: /\/admin\/(documents|decks)\/[^/]+\/draft$/,
  },
  { methods: ['POST'], pattern: /\/admin\/documents\/[^/]+\/publish$/ },
];

/**
 * Si `reviewer` puede llamar a esa ruta `/admin/*`. Un admin, a todas. El agente,
 * solo a leer y guardar borradores y a publicar un documento: no publica
 * presentaciones, no descarta borradores, no archiva ni toca accesos.
 */
export function canUseAdminRoute(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
  method: string,
  path: string,
): boolean {
  if (reviewer.isAdmin) return true;
  return (
    reviewer.isAgent &&
    AGENT_ADMIN_ROUTES.some(
      (route) =>
        route.methods.includes(method.toUpperCase()) &&
        route.pattern.test(path),
    )
  );
}

/** Si puede asignar tareas a otras personas y ver las de todos. */
export function canManageTasks(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
): boolean {
  return reviewer.isAdmin || reviewer.isAgent;
}
