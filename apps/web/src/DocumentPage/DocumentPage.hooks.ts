import { groupApprovals } from '@juntanza/review-core';
import { useOverlay, useReview } from '@juntanza/review-ui';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import {
  countPending,
  readGlossary,
  sectionLabel,
} from '@/content/content.utils';
import DocumentSheet from '@/DocumentSheet/DocumentSheet';
import type { SheetState } from '@/DocumentSheet/sheet.types';
import { useReviewNavigation } from '@/ReviewNavigation/ReviewNavigation.hooks';
import { printTitle } from './print.utils';

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

/** Estado y acciones de la página del documento. `content` se lee una vez al armar la página, como antes. */
export function useDocumentPage(content: () => DocumentContent) {
  const review = useReview();
  const overlay = useOverlay();
  const sections = content().sections;
  const glossary = readGlossary(content());
  const pending = Object.fromEntries(
    sections.map((section) => [section.id, countPending(section)]),
  );
  const totalPending = Object.values(pending).reduce((sum, n) => sum + n, 0);
  const first = sections[0];
  const firstSectionId = first?.id ?? '';
  const highlight = content().highlightSection;

  const navigation = useReviewNavigation(() => sections, content().id);

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

  // El navegador nombra el PDF con el título de la página: durante la impresión (botón o
  // Cmd/Ctrl+P) lleva el del documento y su versión, y después vuelve al del espacio.
  onMount(() => {
    let previous = document.title;
    const onBeforePrint = () => {
      previous = document.title;
      document.title = printTitle(content());
    };
    const onAfterPrint = () => {
      document.title = previous;
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    onCleanup(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.title = previous;
    });
  });

  function goTo(sectionId: string) {
    document.getElementById(`sec-${sectionId}`)?.scrollIntoView();
  }

  function openSheet(state: SheetState) {
    void overlay.sheet(DocumentSheet, { state, content: content(), glossary });
  }

  function openContents() {
    openSheet({ kind: 'contents' });
  }

  function onContentClick(event: MouseEvent) {
    const target = event.target as Element;
    const term = target.closest<HTMLElement>('[data-term]');
    if (term?.dataset.term) {
      openSheet({ kind: 'term', label: term.dataset.term });
      return;
    }
    const cite = target.closest<HTMLElement>('[data-cite]');
    if (cite?.dataset.cite) {
      openSheet({ kind: 'cite', text: cite.dataset.cite });
      return;
    }
    const reference = target.closest<HTMLElement>('[data-section]');
    if (reference?.dataset.section) {
      openSheet({ kind: 'section', sectionNumber: reference.dataset.section });
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

  return {
    sections,
    glossary,
    pending,
    totalPending,
    firstSectionId,
    highlight,
    openContents,
    print: () => window.print(),
    currentId,
    currentLabel,
    currentHeading,
    goTo,
    onContentClick,
    openThreads,
    approvedBlocks,
    navigation,
  };
}
