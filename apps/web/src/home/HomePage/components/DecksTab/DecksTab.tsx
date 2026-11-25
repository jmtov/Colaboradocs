import type { DeckListItem } from '@colaboradocs/deck-core';
import { For, Show } from 'solid-js';
import { deckPath } from '@/shared/router/router';
import ListFilter from '@/shared/ui/ListFilter/ListFilter';
import { timeAgo } from '../../time.utils';
import AddCard from '../AddCard/AddCard';
import Card from '../Card/Card';
import CardGrid from '../CardGrid/CardGrid';
import DeckMenu from '../DeckMenu/DeckMenu';
import GridMessage from '../GridMessage/GridMessage';
import { useDecksTab } from './DecksTab.hooks';
import styles from './DecksTab.module.css';

type Props = {
  decks: DeckListItem[];
  isAdmin: boolean;
  /** Tras archivar una presentación: volver a pedir la lista. */
  onChange: () => void;
};

/** El tab de presentaciones: buscador y las tarjetas; los admins pueden crear una nueva. */
export default function DecksTab(props: Props) {
  const tab = useDecksTab(() => props.decks);
  const filtering = () => tab.visible().length !== props.decks.length;

  return (
    <section class={styles.section}>
      <ListFilter
        summary={
          filtering()
            ? `${tab.visible().length} de ${props.decks.length}`
            : null
        }
        placeholder="Buscar presentaciones"
        query={tab.query()}
        onQuery={tab.setQuery}
      />
      <CardGrid>
        <For each={tab.visible()}>
          {(deck) => (
            <Card
              href={deckPath(deck.id)}
              meta={`${deck.slides} ${deck.slides === 1 ? 'slide' : 'slides'}${
                props.isAdmin && deck.hasDraft ? ' · borrador sin publicar' : ''
              }`}
              title={deck.title}
              time={timeAgo(deck.updatedAt)}
              menu={
                props.isAdmin ? (
                  <DeckMenu
                    id={deck.id}
                    title={deck.title}
                    onChange={props.onChange}
                  />
                ) : undefined
              }
            />
          )}
        </For>
        <Show when={props.decks.length === 0 && !props.isAdmin}>
          <GridMessage>Todavía no hay presentaciones.</GridMessage>
        </Show>
        <Show when={props.decks.length > 0 && tab.visible().length === 0}>
          <GridMessage>
            Ninguna presentación coincide.{' '}
            <button
              type="button"
              class={styles.clearFilter}
              onClick={tab.clearFilter}
            >
              Quitar el filtro
            </button>
          </GridMessage>
        </Show>
        <Show when={props.isAdmin}>
          <AddCard
            label="Nueva presentación"
            hint="Desde cero o un JSON"
            onClick={tab.openNewDeck}
          />
        </Show>
      </CardGrid>
    </section>
  );
}
