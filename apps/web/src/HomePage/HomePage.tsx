import { For, Show } from 'solid-js';
import type { DocumentListItem } from '@/content/content.types';
import PlusIcon from '@/icons/PlusIcon';
import Link from '@/router/Link';
import { documentPath } from '@/router/router';
import UserMenu from '@/UserMenu/UserMenu';
import DocumentMenu from './components/DocumentMenu/DocumentMenu';
import { useHomePage } from './HomePage.hooks';
import styles from './HomePage.module.css';
import { timeAgo } from './time.utils';

type Props = {
  name: string;
  description?: string;
  documents: DocumentListItem[];
};

export default function HomePage(props: Props) {
  const home = useHomePage();

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
        <ul class={styles.grid}>
          <For
            each={props.documents}
            fallback={
              <Show when={!home.isAdmin()}>
                <li class={styles.empty}>Todavía no hay documentos.</li>
              </Show>
            }
          >
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
                  <span class={styles.footer}>
                    <span
                      classList={{ [styles.open]: document.openThreads > 0 }}
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
                    <DocumentMenu id={document.id} title={document.title} />
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
                onClick={home.openUpload}
              >
                <PlusIcon class={styles.addIcon} />
                <span class={styles.addLabel}>Subir documento</span>
                <span class={styles.addHint}>Word, Markdown o JSON</span>
              </button>
            </li>
          </Show>
        </ul>
      </main>
    </>
  );
}
