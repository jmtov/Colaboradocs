import type { DeckListItem } from '@colaboradocs/deck-core';
import { groupDocuments } from '@colaboradocs/review-core';
import { createMemo, For, Show } from 'solid-js';
import type { DocumentListItem } from '@/content/content.types';
import PlusIcon from '@/icons/PlusIcon';
import Link from '@/router/Link';
import { deckPath, documentPath } from '@/router/router';
import UserMenu from '@/UserMenu/UserMenu';
import DeckMenu from './components/DeckMenu/DeckMenu';
import DocumentMenu from './components/DocumentMenu/DocumentMenu';
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
  const grouped = createMemo(() => groupDocuments(props.documents));

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
          <span class={styles.eyebrow}>
            {props.documents.length}{' '}
            {props.documents.length === 1 ? 'documento' : 'documentos'}
          </span>
          <h1 class={styles.title}>{props.name}</h1>
          <Show when={props.description}>
            <p class={styles.lead}>{props.description}</p>
          </Show>
        </section>
        <For each={grouped().groups}>
          {(group, index) => (
            <section class={styles.group}>
              <Show when={grouped().titled}>
                <h2 class={styles.groupTitle}>
                  {group.title}
                  <span class={styles.count}>{group.items.length}</span>
                </h2>
              </Show>
              <ul class={styles.grid}>
                <For each={group.items}>
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
                          Versión {document.version} · {document.updated}
                        </span>
                        <span class={styles.cardTitle}>{document.title}</span>
                        <Show when={document.description}>
                          <span class={styles.description}>
                            {document.description}
                          </span>
                        </Show>
                        <Show when={document.responsable}>
                          <span class={styles.people}>
                            Responsable: {document.responsable}
                          </span>
                        </Show>
                        <Show when={document.participantes}>
                          <span class={styles.people}>
                            Participantes: {document.participantes}
                          </span>
                        </Show>
                        <span class={styles.footer}>
                          <span
                            classList={{
                              [styles.open]: document.openThreads > 0,
                            }}
                          >
                            {document.openThreads}{' '}
                            {document.openThreads === 1
                              ? 'hilo abierto'
                              : 'hilos abiertos'}
                          </span>
                          <span>{document.approvals} OK</span>
                          <span class={styles.last}>
                            {document.lastActivityAt
                              ? timeAgo(document.lastActivityAt)
                              : 'Sin actividad'}
                          </span>
                        </span>
                      </Link>
                      <Show when={home.isAdmin()}>
                        <div class={styles.menu}>
                          <DocumentMenu
                            id={document.id}
                            title={document.title}
                          />
                        </div>
                      </Show>
                    </li>
                  )}
                </For>
                <Show
                  when={
                    home.isAdmin() && index() === grouped().groups.length - 1
                  }
                >
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
          )}
        </For>
        <Show when={props.documents.length === 0}>
          <ul class={styles.grid}>
            <Show
              when={home.isAdmin()}
              fallback={
                <li class={styles.empty}>Todavía no hay documentos.</li>
              }
            >
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
        </Show>
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
