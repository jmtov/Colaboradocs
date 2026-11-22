import type { Theme } from '../theme/theme.types';
import type { Deck } from './deck.types';

/** Una presentación en la lista de la home. */
export interface DeckListItem {
  id: string;
  title: string;
  themeId: string;
  slides: number;
  updatedAt: string;
  /** Hay un borrador del editor sin publicar (solo lo usa el admin). */
  hasDraft: boolean;
}

/** Lo que pide el visor para dibujar una presentación: el deck, su tema y los archivos que usa. */
export interface DeckBundle {
  deck: Deck;
  theme: Theme;
  /** Rutas (relativas a `assets/`) de los archivos propios del deck. */
  files: string[];
}

/** Un tema en la lista de administración. */
export interface ThemeListItem {
  id: string;
  name: string;
  variants: number;
  updatedAt: string;
}

/** El borrador de una presentación: un deck que puede estar incompleto. */
export interface DeckDraft {
  content: Deck;
  savedAt: string;
}
