import type { DeckListItem } from '@colaboradocs/deck-core';
import { matchesQuery } from '@colaboradocs/review-core';
import { useOverlay } from '@colaboradocs/review-ui';
import { createMemo, createSignal } from 'solid-js';
import NewDeckSheet from '@/NewDeckSheet/NewDeckSheet';

/** Estado y acciones del tab de presentaciones: la búsqueda y crear una nueva. */
export function useDecksTab(decks: () => DeckListItem[]) {
  const overlay = useOverlay();
  const [query, setQuery] = createSignal('');
  const visible = createMemo(() =>
    decks().filter((deck) => matchesQuery(query(), [deck.title])),
  );

  return {
    query,
    setQuery,
    visible,
    clearFilter: () => setQuery(''),
    openNewDeck: () => void overlay.sheet(NewDeckSheet, {}),
  };
}
