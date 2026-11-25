import type { HomeTab } from '@/router/router';

/** El lugar de cada tab, de izquierda a derecha: decide hacia dónde se desliza el contenido al cambiar. */
export const TAB_ORDER: Record<HomeTab, number> = {
  documents: 0,
  decks: 1,
  tasks: 2,
};
