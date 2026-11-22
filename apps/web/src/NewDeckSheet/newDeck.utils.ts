import { type Deck, defaultSlide } from '@colaboradocs/deck-core';

/** La presentación más chica que el servidor acepta: una slide de portada para empezar. */
export function blankDeck(id: string, title: string, themeId: string): Deck {
  return {
    version: 1,
    id,
    title,
    lang: 'es',
    theme: themeId,
    slides: [defaultSlide('cover')],
  };
}
