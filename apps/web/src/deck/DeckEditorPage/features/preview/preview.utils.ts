import type { Deck, Theme } from '@colaboradocs/deck-core';
import { buildDeckHtml, type DeckFiles } from '@/deck/DeckPage/deck.utils';

/** El HTML de la vista previa: el deck a medias también se dibuja, con fuentes y archivos incrustados. */
export function buildPreviewHtml(
  deck: Deck,
  theme: Theme,
  loaded: DeckFiles,
): string {
  return buildDeckHtml({ deck, theme }, loaded, { preview: true });
}
