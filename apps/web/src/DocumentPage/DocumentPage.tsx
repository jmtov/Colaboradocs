import { BlockLayer } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import Hero from '@/Hero/Hero';
import HowToReview from '@/HowToReview/HowToReview';
import PeopleCards from '@/PeopleCards/PeopleCards';
import ReviewNavigation from '@/ReviewNavigation/ReviewNavigation';
import ReviewSummary from '@/ReviewSummary/ReviewSummary';
import SectionCards from '@/SectionCards/SectionCards';
import SectionView from '@/SectionView/SectionView';
import SideNav from '@/SideNav/SideNav';
import SourcesFooter from '@/SourcesFooter/SourcesFooter';
import TopBar from '@/TopBar/TopBar';
import DocumentTaskList from './components/DocumentTaskList/DocumentTaskList';
import { useDocumentPage } from './DocumentPage.hooks';
import styles from './DocumentPage.module.css';

export default function DocumentPage(props: {
  content: DocumentContent;
  /** Hay más documentos: se muestra el enlace de regreso a la home. */
  multiple?: boolean;
}) {
  const page = useDocumentPage(() => props.content);

  return (
    <>
      <TopBar
        documentId={props.content.id}
        documentName={props.content.shortName ?? props.content.title}
        showBack={props.multiple}
        currentLabel={page.currentLabel()}
        currentHeading={page.currentHeading()}
        onOpenContents={page.openContents}
        onPrint={page.print}
      />
      <div class={styles.page}>
        <Hero
          title={props.content.title}
          version={props.content.version}
          firstSectionId={page.firstSectionId}
          tipo={props.content.tipo}
          eyebrow={props.content.eyebrow}
          lead={props.content.lead}
          highlight={page.highlight}
          onGo={page.goTo}
        />
        <Show when={page.peopleOf(props.content.responsable).length > 0}>
          <PeopleCards
            title="Responsable"
            people={page.peopleOf(props.content.responsable)}
            onOpen={page.openPerson}
          />
        </Show>
        <Show when={page.peopleOf(props.content.participantes).length > 0}>
          <PeopleCards
            title="Participantes"
            people={page.peopleOf(props.content.participantes)}
            onOpen={page.openPerson}
          />
        </Show>
        <ReviewSummary
          tiles={[
            {
              label: 'Versión',
              value: props.content.version,
              onClick: page.navigation.openVersions,
            },
            {
              label: 'Pendientes',
              value: String(page.totalPending),
              onClick: () => page.navigation.openList('pending'),
            },
            {
              label: 'Hilos abiertos',
              value: page.openThreads(),
              onClick: () => page.navigation.openList('threads'),
            },
            {
              label: 'Bloques con OK',
              value: page.approvedBlocks(),
              onClick: () => page.navigation.openList('approved'),
            },
          ]}
        />
        <SectionCards
          sections={page.sections}
          pending={page.pending}
          onGo={page.goTo}
        />
        <div class={styles.shell}>
          <SideNav
            sections={page.sections}
            currentId={page.currentId()}
            onGo={page.goTo}
          />
          <main
            class={styles.main}
            ref={(element) =>
              element.addEventListener('click', page.onContentClick)
            }
          >
            <BlockLayer>
              <For each={page.sections}>
                {(section) => (
                  <SectionView
                    section={section}
                    glossaryTerms={props.content.glossaryTerms}
                    peopleTerms={props.content.peopleTerms}
                  />
                )}
              </For>
            </BlockLayer>
          </main>
        </div>
        <DocumentTaskList documentId={props.content.id} />
        <SourcesFooter
          title={props.content.title}
          version={props.content.version}
          updated={props.content.updated}
          sources={props.content.sources}
        />
      </div>
      <HowToReview />
      <ReviewNavigation navigation={page.navigation} />
    </>
  );
}
