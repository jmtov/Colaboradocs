import type { Reviewer } from './review.types';

/** Rutas de administración que también puede usar el agente: leer y guardar el borrador. */
const AGENT_ADMIN_ROUTE = /\/admin\/(documents|decks)\/[^/]+\/draft$/;
const AGENT_ADMIN_METHODS = new Set(['GET', 'PUT']);

/**
 * Si `reviewer` puede llamar a esa ruta `/admin/*`. Un admin, a todas. El agente,
 * solo a leer (`GET`) y guardar (`PUT`) el borrador de un documento o una
 * presentación: no publica, no descarta borradores, no archiva ni toca accesos.
 */
export function canUseAdminRoute(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
  method: string,
  path: string,
): boolean {
  if (reviewer.isAdmin) return true;
  return (
    reviewer.isAgent &&
    AGENT_ADMIN_METHODS.has(method.toUpperCase()) &&
    AGENT_ADMIN_ROUTE.test(path)
  );
}

/** Si puede asignar tareas a otras personas y ver las de todos. */
export function canManageTasks(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
): boolean {
  return reviewer.isAdmin || reviewer.isAgent;
}
