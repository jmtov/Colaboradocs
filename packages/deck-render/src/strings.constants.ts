import type { AgendaMode } from '@colaboradocs/deck-core';

export interface Strings {
  modes: Record<AgendaMode, string>;
  minutesTitle: string;
  speakerTitle: string;
  previous: string;
  next: string;
  navigate: string;
  fullscreen: string;
  theme: string;
  themeAria: string;
  navAria: string;
  sourceFallback: string;
}

/** Textos de la interfaz; el contenido del deck no pasa por aquí. */
export const STRINGS_ES: Strings = {
  modes: { inform: 'Informar', discuss: 'Conversar', decide: 'Decidir' },
  minutesTitle: 'Tiempo aproximado',
  speakerTitle: 'Quien habla',
  previous: 'Anterior',
  next: 'Siguiente',
  navigate: 'navegar',
  fullscreen: 'pantalla completa',
  theme: 'claro / oscuro',
  themeAria: 'Cambiar tema',
  navAria: 'Navegación',
  sourceFallback: 'Fuente',
};
