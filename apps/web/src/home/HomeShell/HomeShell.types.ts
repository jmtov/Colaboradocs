import type { JSX } from 'solid-js';
import type { HomeTab } from '@/shared/router/router';

export type HomeShellProps = {
  /** Nombre del espacio: va en la barra y de título. */
  name: string;
  tab: HomeTab;
  /** Cuántos hay de cada cosa, en el tab. `tasks` es null mientras no cargan. */
  counts: { documents: number; decks: number; tasks: number | null };
  /** Muestra el tab de presentaciones aunque no haya ninguna (admins, que pueden crear). */
  alwaysShowDecks: boolean;
  /** Se perdió la conexión: se avisa junto a la cuenta. */
  offline: boolean;
  children: JSX.Element;
};
