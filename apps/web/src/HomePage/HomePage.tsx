import type { DeckListItem } from '@colaboradocs/deck-core';
import { documentDate, kindLabel } from '@colaboradocs/review-core';
import { For, Show } from 'solid-js';
import type { DocumentListItem } from '@/content/content.types';
import CheckIcon from '@/icons/CheckIcon';
import MessageSquareIcon from '@/icons/MessageSquareIcon';
import PlusIcon from '@/icons/PlusIcon';
import Link from '@/router/Link';
import { deckPath, documentPath } from '@/router/router';
import UserMenu from '@/UserMenu/UserMenu';
import CardStat from './components/CardStat/CardStat';
import DeckMenu from './components/DeckMenu/DeckMenu';
import DocumentFilter from './components/DocumentFilter/DocumentFilter';
import DocumentMenu from './components/DocumentMenu/DocumentMenu';
import PeopleLine from './components/PeopleLine/PeopleLine';
import { useHomePage } from './HomePage.hooks';
import styles from './HomePage.module.css';
import { timeAgo } from './time.utils';

type Props = {
  name: string;
  description?: string;
  documents: DocumentListItem[];
  decks: DeckListItem[];
  /** Tras archivar una presentación: volver a pedir la lista. */
  onDecksChange?: () => void;
};

export default function HomePage(props: Props) {
  const home = useHomePage(() => props.documents);

  return (
    <>
      <header class={styles.bar}>
        <div class={styles.barInner}>
          <span class={styles.barName}>{props.name}</span>
          <div class={styles.account}>
            <Show when={home.offline()}>
              <span role="status">Sin conexión</span>
            </Show>
            <UserMenu />
          </div>
        </div>
      </header>
      <main class={styles.page}>
        <section class={styles.intro}>
          <h1 class={styles.title}>{props.name}</h1>
          <Show when={props.description}>
            <p class={styles.lead}>{props.description}</p>
          </Show>
        </section>
        <section class={styles.section}>
          <div class={styles.toolbar}>
            <h2 class={styles.eyebrow}>
              {home.visible().length === props.documents.length
                ? props.documents.length
                : `${home.visible().length} de ${props.documents.length}`}{' '}
              {props.documents.length === 1 ? 'documento' : 'documentos'}
            </h2>
            <Show when={props.documents.length > 1}>
              <DocumentFilter
                query={home.query()}
                onQuery={home.setQuery}
                canFilter={home.kinds().length > 1}
                onOpenFilters={() => void home.openFilters()}
                activeKind={home.kindTitle()}
                onClearKind={() => home.setKind(null)}
              />
            </Show>
          </div>
          <ul class={styles.grid}>
            <For each={home.visible()}>
              {(document) => (
                <li class={styles.item}>
                  <Link
                    lift
                    href={documentPath(document.id)}
                    class={
                      home.isAdmin()
                        ? `${styles.card} ${styles.withMenu}`
                        : styles.card
                    }
                  >
                    <span class={styles.meta}>
                      {kindLabel(document)} · {documentDate(document)}
                    </span>
                    <span class={styles.cardTitle}>{document.title}</span>
                    <Show when={document.description}>
                      <span class={styles.description}>
                        {document.description}
                      </span>
                    </Show>
                    <Show when={document.owner}>
                      {(people) => (
                        <PeopleLine label="Responsable" people={people()} />
                      )}
                    </Show>
                    <Show when={document.attendees}>
                      {(people) => (
                        <PeopleLine label="Participantes" people={people()} />
                      )}
                    </Show>
                    <span class={styles.footer}>
                      <CardStat
                        icon={MessageSquareIcon}
                        count={document.openThreads}
                        label={
                          document.openThreads === 1
                            ? '1 hilo abierto'
                            : `${document.openThreads} hilos abiertos`
                        }
                        highlight={document.openThreads > 0}
                      />
                      <CardStat
                        icon={CheckIcon}
                        count={document.approvals}
                        label={
                          document.approvals === 1
                            ? '1 aprobación'
                            : `${document.approvals} aprobaciones`
                        }
                      />
                      <span class={styles.last}>
                        {document.lastActivityAt
                          ? timeAgo(document.lastActivityAt)
                          : 'Sin actividad'}
                      </span>
                    </span>
                  </Link>
                  <Show when={home.isAdmin()}>
                    <div class={styles.menu}>
                      <DocumentMenu id={document.id} title={document.title} />
                    </div>
                  </Show>
                </li>
              )}
            </For>
            <Show when={props.documents.length === 0 && !home.isAdmin()}>
              <li class={styles.empty}>Todavía no hay documentos.</li>
            </Show>
            <Show
              when={props.documents.length > 0 && home.visible().length === 0}
            >
              <li class={styles.empty}>
                Ningún documento coincide.{' '}
                <button
                  type="button"
                  class={styles.clearFilter}
                  onClick={home.clearFilter}
                >
                  Quitar el filtro
                </button>
              </li>
            </Show>
            <Show when={home.isAdmin()}>
              <li class={styles.item}>
                <button
                  type="button"
                  class={`${styles.card} ${styles.add}`}
                  onClick={home.openUpload}
                >
                  <PlusIcon class={styles.addIcon} />
                  <span class={styles.addLabel}>Subir documento</span>
                  <span class={styles.addHint}>Word, Markdown o JSON</span>
                </button>
              </li>
            </Show>
          </ul>
        </section>
        <Show when={props.decks.length > 0 || home.isAdmin()}>
          <section class={styles.section}>
            <span class={styles.eyebrow}>
              {props.decks.length}{' '}
              {props.decks.length === 1 ? 'presentación' : 'presentaciones'}
            </span>
            <ul class={styles.grid}>
              <For each={props.decks}>
                {(deck) => (
                  <li class={styles.item}>
                    <Link
                      lift
                      href={deckPath(deck.id)}
                      class={
                        home.isAdmin()
                          ? `${styles.card} ${styles.withMenu}`
                          : styles.card
                      }
                    >
                      <span class={styles.meta}>
                        {deck.slides} {deck.slides === 1 ? 'slide' : 'slides'}
                        <Show when={home.isAdmin() && deck.hasDraft}>
                          {' · borrador sin publicar'}
                        </Show>
                      </span>
                      <span class={styles.cardTitle}>{deck.title}</span>
                      <span class={styles.footer}>
                        <span class={styles.last}>
                          {timeAgo(deck.updatedAt)}
                        </span>
                      </span>
                    </Link>
                    <Show when={home.isAdmin()}>
                      <div class={styles.menu}>
                        <DeckMenu
                          id={deck.id}
                          title={deck.title}
                          onChange={() => props.onDecksChange?.()}
                        />
                      </div>
                    </Show>
                  </li>
                )}
              </For>
              <Show when={home.isAdmin()}>
                <li class={styles.item}>
                  <button
                    type="button"
                    class={`${styles.card} ${styles.add}`}
                    onClick={home.openNewDeck}
                  >
                    <PlusIcon class={styles.addIcon} />
                    <span class={styles.addLabel}>Nueva presentación</span>
                    <span class={styles.addHint}>Desde cero o un JSON</span>
                  </button>
                </li>
              </Show>
            </ul>
          </section>
        </Show>
        <Show when={home.archived().length > 0}>
          <details class={styles.archived}>
            <summary class={styles.archivedSummary}>
              Archivados
              <span class={styles.count}>{home.archived().length}</span>
            </summary>
            <p class={styles.archivedHint}>
              Solo los ven admins y no se pueden abrir. Para recuperar uno,
              vuelve a subirlo.
            </p>
            <ul class={styles.archivedList}>
              <For each={home.archived()}>
                {(document) => (
                  <li class={styles.archivedItem}>
                    <span>{document.title}</span>
                    <span class={styles.meta}>
                      {document.id} · {document.updated}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </details>
        </Show>
      </main>
    </>
  );
}
