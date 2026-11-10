import { groupApprovals } from '@juntanza/review-core';
import { BlockLayer, useReview } from '@juntanza/review-ui';
import { createMemo, createSignal, For, onCleanup, onMount } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import {
  countPending,
  readGlossary,
  sectionLabel,
} from '@/content/content.utils';
import DocumentSheet from '@/DocumentSheet/DocumentSheet';
import type { SheetState } from '@/DocumentSheet/sheet.types';
import Hero from '@/Hero/Hero';
import HowToReview from '@/HowToReview/HowToReview';
import ReviewSummary from '@/ReviewSummary/ReviewSummary';
import SectionCards from '@/SectionCards/SectionCards';
import SectionView from '@/SectionView/SectionView';
import SideNav from '@/SideNav/SideNav';
import SourcesFooter from '@/SourcesFooter/SourcesFooter';
import TopBar from '@/TopBar/TopBar';
import styles from './DocumentPage.module.css';

/** La sección activa es la última cuyo borde superior ya pasó este punto. */
const ACTIVE_SECTION_OFFSET_PX = 110;

/** Texto del último título de grupo (h3) de la sección que ya pasó del borde superior; vacío si aún no hay. */
function readCurrentHeading(section: HTMLElement | null): string {
  if (!section) return '';
  let heading = '';
  for (const element of section.querySelectorAll<HTMLElement>(
    '[data-outline-level="2"]',
  )) {
    if (element.getBoundingClientRect().top > ACTIVE_SECTION_OFFSET_PX) break;
    heading = (element.textContent ?? '').trim();
  }
  return heading;
}

export default function DocumentPage(props: {
  content: DocumentContent;
  /** Hay más documentos: se muestra el enlace de regreso a la home. */
  multiple?: boolean;
}) {
  const review = useReview();
  const sections = props.content.sections;
  const glossary = readGlossary(props.content);
  const pending = Object.fromEntries(
    sections.map((section) => [section.id, countPending(section)]),
  );
  const totalPending = Object.values(pending).reduce((sum, n) => sum + n, 0);

  const [sheet, setSheet] = createSignal<SheetState>({ kind: 'none' });
  const [currentId, setCurrentId] = createSignal('');
  const [currentHeading, setCurrentHeading] = createSignal('');
  const [blockIds, setBlockIds] = createSignal<Set<string>>(new Set());

  const currentLabel = () => {
    const current = sections.find((section) => section.id === currentId());
    return current ? sectionLabel(current) : 'Inicio';
  };

  function updateCurrent() {
    let current = '';
    let currentElement: HTMLElement | null = null;
    for (const section of sections) {
      const element = document.getElementById(`sec-${section.id}`);
      if (
        element &&
        element.getBoundingClientRect().top <= ACTIVE_SECTION_OFFSET_PX
      ) {
        current = section.id;
        currentElement = element;
      }
    }
    setCurrentId(current);
    setCurrentHeading(readCurrentHeading(currentElement));
  }

  onMount(() => {
    const ids = new Set<string>();
    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-block-id]',
    )) {
      ids.add(element.dataset.blockId ?? '');
    }
    setBlockIds(ids);
    updateCurrent();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateCurrent);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    });
  });

  function goTo(sectionId: string) {
    document.getElementById(`sec-${sectionId}`)?.scrollIntoView();
  }

  function onContentClick(event: MouseEvent) {
    const target = event.target as Element;
    const term = target.closest<HTMLElement>('[data-term]');
    if (term?.dataset.term) {
      setSheet({ kind: 'term', label: term.dataset.term });
      return;
    }
    const cite = target.closest<HTMLElement>('[data-cite]');
    if (cite?.dataset.cite) {
      setSheet({ kind: 'cite', text: cite.dataset.cite });
      return;
    }
    const reference = target.closest<HTMLElement>('[data-section]');
    if (reference?.dataset.section) {
      setSheet({ kind: 'section', sectionNumber: reference.dataset.section });
    }
  }

  const openThreads = createMemo(() => {
    const snapshot = review.snapshot();
    if (!snapshot) return '…';
    return String(
      snapshot.comments.filter(
        (comment) =>
          comment.parentId === null &&
          !comment.resolved &&
          comment.text !== null,
      ).length,
    );
  });
  const approvedBlocks = createMemo(() => {
    const snapshot = review.snapshot();
    if (!snapshot) return '…';
    const approved = groupApprovals(snapshot.approvals);
    const count = [...approved.keys()].filter((id) =>
      blockIds().has(id),
    ).length;
    return `${count}/${blockIds().size}`;
  });

  const first = sections[0];
  const highlight = props.content.highlightSection;

  return (
    <>
      <TopBar
        documentName={props.content.shortName ?? props.content.title}
        showBack={props.multiple}
        currentLabel={currentLabel()}
        currentHeading={currentHeading()}
        onOpenContents={() => setSheet({ kind: 'contents' })}
      />
      <div class={styles.page}>
        <Hero
          title={props.content.title}
          version={props.content.version}
          firstSectionId={first?.id ?? ''}
          eyebrow={props.content.eyebrow}
          lead={props.content.lead}
          highlight={highlight}
          onGo={goTo}
        />
        <ReviewSummary
          tiles={[
            { label: 'Versión', value: props.content.version },
            { label: 'Pendientes', value: String(totalPending) },
            { label: 'Hilos abiertos', value: openThreads() },
            { label: 'Bloques con OK', value: approvedBlocks() },
          ]}
        />
        <SectionCards sections={sections} pending={pending} onGo={goTo} />
        <div class={styles.shell}>
          <SideNav sections={sections} currentId={currentId()} onGo={goTo} />
          <main
            class={styles.main}
            ref={(element) => element.addEventListener('click', onContentClick)}
          >
            <BlockLayer>
              <For each={sections}>
                {(section) => (
                  <SectionView
                    section={section}
                    glossaryTerms={props.content.glossaryTerms}
                  />
                )}
              </For>
            </BlockLayer>
          </main>
        </div>
        <SourcesFooter
          title={props.content.title}
          version={props.content.version}
          updated={props.content.updated}
          sources={props.content.sources}
        />
      </div>
      <HowToReview />
      <DocumentSheet
        sheet={sheet()}
        content={props.content}
        glossary={glossary}
        onClose={() => setSheet({ kind: 'none' })}
      />
    </>
  );
}
