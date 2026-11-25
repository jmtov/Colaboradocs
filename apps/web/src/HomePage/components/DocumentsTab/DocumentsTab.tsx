import { documentDate, kindLabel } from '@colaboradocs/review-core';
import { For, Show } from 'solid-js';
import type { DocumentListItem } from '@/content/content.types';
import CheckIcon from '@/icons/CheckIcon';
import MessageSquareIcon from '@/icons/MessageSquareIcon';
import ListFilter from '@/ListFilter/ListFilter';
import { documentPath } from '@/router/router';
import { timeAgo } from '../../time.utils';
import AddCard from '../AddCard/AddCard';
import Card from '../Card/Card';
import CardGrid from '../CardGrid/CardGrid';
import CardStat from '../CardStat/CardStat';
import DocumentMenu from '../DocumentMenu/DocumentMenu';
import GridMessage from '../GridMessage/GridMessage';
import PeopleLine from '../PeopleLine/PeopleLine';
import { useDocumentsTab } from './DocumentsTab.hooks';
import styles from './DocumentsTab.module.css';

type Props = {
  documents: DocumentListItem[];
  isAdmin: boolean;
};

/** El tab de documentos: buscador, filtro por tipo, las tarjetas y, para admins, los archivados. */
export default function DocumentsTab(props: Props) {
  const tab = useDocumentsTab(
    () => props.documents,
    () => props.isAdmin,
  );
  const filtering = () => tab.visible().length !== props.documents.length;

  return (
    <>
      <section class={styles.section}>
        <ListFilter
          summary={
            filtering()
              ? `${tab.visible().length} de ${props.documents.length}`
              : null
          }
          placeholder="Buscar documentos"
          query={tab.query()}
          onQuery={tab.setQuery}
          canFilter={tab.kinds().length > 1}
          onOpenFilters={() => void tab.openFilters()}
          activeLabel={tab.kindTitle()}
          onClear={() => tab.setKind(null)}
        />
        <CardGrid>
          <For each={tab.visible()}>
            {(document) => (
              <Card
                href={documentPath(document.id)}
                meta={`${kindLabel(document)} · ${documentDate(document)}`}
                title={document.title}
                description={document.description}
                menu={
                  props.isAdmin ? (
                    <DocumentMenu id={document.id} title={document.title} />
                  ) : undefined
                }
                footer={
                  <>
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
                  </>
                }
                time={
                  document.lastActivityAt
                    ? timeAgo(document.lastActivityAt)
                    : 'Sin actividad'
                }
              >
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
              </Card>
            )}
          </For>
          <Show when={props.documents.length === 0 && !props.isAdmin}>
            <GridMessage>Todavía no hay documentos.</GridMessage>
          </Show>
          <Show when={props.documents.length > 0 && tab.visible().length === 0}>
            <GridMessage>
              Ningún documento coincide.{' '}
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
              label="Nuevo documento"
              hint="Desde cero, Word, Markdown o JSON"
              onClick={tab.openUpload}
            />
          </Show>
        </CardGrid>
      </section>
      <Show when={tab.archived().length > 0}>
        <details class={styles.archived}>
          <summary class={styles.archivedSummary}>
            Archivados
            <span class={styles.count}>{tab.archived().length}</span>
          </summary>
          <p class={styles.archivedHint}>
            Solo los ven admins y no se pueden abrir. Para recuperar uno, vuelve
            a subirlo.
          </p>
          <ul class={styles.archivedList}>
            <For each={tab.archived()}>
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
    </>
  );
}
