import type { NavKind } from './ReviewNavigation.types';

/** Cómo se llama cada recorrido, en la hoja y en la barra. */
export const NAV_TITLES: Record<NavKind, string> = {
  threads: 'Hilos abiertos',
  pending: 'Pendientes',
  approved: 'Bloques con OK',
};

/** Largo máximo del texto de un bloque en la lista. */
export const EXCERPT_MAX_LENGTH = 140;
