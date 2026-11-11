import {
  groupApprovals,
  groupThreads,
  openThreadCount,
} from '@juntanza/review-core';
import { useReview } from '@juntanza/review-ui';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import type { DocumentSection } from '@/content/content.types';
import { sectionLabel } from '@/content/content.utils';
import { EXCERPT_MAX_LENGTH } from './ReviewNavigation.constants';
import type { NavItem, NavKind } from './ReviewNavigation.types';
import {
  clampIndex,
  excerpt,
  inDocumentOrder,
  readBlockOrder,
  readPendingIds,
  stepIndex,
} from './ReviewNavigation.utils';

/** Marca el bloque que recorre la barra; el estilo vive en `BlockLayer`. */
const CURRENT_ATTRIBUTE = 'data-nav-current';

function findBlock(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-block-id="${CSS.escape(id)}"]`,
  );
}

function scrollToBlock(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  findBlock(id)?.scrollIntoView({
    block: 'center',
    behavior: reduce ? 'auto' : 'smooth',
  });
}

/**
 * Recorrer los bloques de la revisión desde el resumen: una hoja con la lista,
 * y al elegir uno, una barra inferior para ir de uno a otro. La lista sale de
 * la revisión en vivo: si un hilo se resuelve, deja de estar.
 */
export function useReviewNavigation(sections: () => DocumentSection[]) {
  const review = useReview();
  const [order, setOrder] = createSignal<string[]>([]);
  const [pendingIds, setPendingIds] = createSignal<Set<string>>(new Set());
  const [listKind, setListKind] = createSignal<NavKind | null>(null);
  const [versionsOpen, setVersionsOpen] = createSignal(false);
  const [barKind, setBarKind] = createSignal<NavKind | null>(null);
  const [currentId, setCurrentId] = createSignal('');
  // Dónde estaba el bloque actual: si deja de estar en la lista, la barra cae ahí.
  let lastIndex = 0;

  onMount(() => {
    setOrder(readBlockOrder(document));
    setPendingIds(readPendingIds(document));
  });

  const threadsByBlock = createMemo(() =>
    groupThreads(review.snapshot()?.comments ?? []),
  );
  const approvalsByBlock = createMemo(() =>
    groupApprovals(review.snapshot()?.approvals ?? []),
  );

  function blockIdsFor(kind: NavKind): string[] {
    switch (kind) {
      case 'threads': {
        const threads = threadsByBlock();
        return order().filter(
          (id) => openThreadCount(threads.get(id) ?? []) > 0,
        );
      }
      case 'approved': {
        const approvals = approvalsByBlock();
        return order().filter((id) => approvals.has(id));
      }
      case 'pending':
        return inDocumentOrder(order(), pendingIds());
    }
  }

  function metaFor(kind: NavKind, id: string): string {
    if (kind === 'threads') {
      const open = openThreadCount(threadsByBlock().get(id) ?? []);
      return `${open} ${open === 1 ? 'hilo' : 'hilos'}`;
    }
    if (kind === 'approved') {
      return `✓ ${approvalsByBlock().get(id)?.length ?? 0}`;
    }
    return '';
  }

  function sectionOf(element: HTMLElement): string {
    const container = element.closest<HTMLElement>('[id^="sec-"]');
    const found = sections().find(
      (section) => `sec-${section.id}` === container?.id,
    );
    return found ? sectionLabel(found) : '';
  }

  function itemsFor(kind: NavKind): NavItem[] {
    return blockIdsFor(kind).map((id) => {
      const element = findBlock(id);
      return {
        id,
        text: excerpt(element?.textContent ?? '', EXCERPT_MAX_LENGTH),
        section: element ? sectionOf(element) : '',
        meta: metaFor(kind, id),
      };
    });
  }

  const listItems = createMemo(() => {
    const kind = listKind();
    return kind ? itemsFor(kind) : [];
  });
  const barIds = createMemo(() => {
    const kind = barKind();
    return kind ? blockIdsFor(kind) : [];
  });
  const barIndex = () => Math.max(0, barIds().indexOf(currentId()));

  function closeBar() {
    setBarKind(null);
    setCurrentId('');
  }

  // Mantiene la barra coherente con la revisión: sin bloques se cierra; si el
  // actual ya no está (p. ej. se resolvió su hilo), pasa al que ocupó su lugar.
  createEffect(() => {
    if (!barKind()) return;
    const ids = barIds();
    if (ids.length === 0) {
      closeBar();
      return;
    }
    const at = ids.indexOf(currentId());
    if (at >= 0) {
      lastIndex = at;
      return;
    }
    lastIndex = clampIndex(lastIndex, ids.length);
    setCurrentId(ids[lastIndex] ?? '');
  });

  createEffect(() => {
    const id = barKind() ? currentId() : '';
    const element = id ? findBlock(id) : null;
    element?.setAttribute(CURRENT_ATTRIBUTE, '');
    onCleanup(() => element?.removeAttribute(CURRENT_ATTRIBUTE));
  });

  function pick(id: string) {
    const kind = listKind();
    if (!kind) return;
    setListKind(null);
    setBarKind(kind);
    setCurrentId(id);
    lastIndex = Math.max(0, blockIdsFor(kind).indexOf(id));
    scrollToBlock(id);
  }

  function step(delta: 1 | -1) {
    const ids = barIds();
    const next = ids[stepIndex(barIndex(), ids.length, delta)];
    if (!next) return;
    setCurrentId(next);
    scrollToBlock(next);
  }

  return {
    listKind,
    listItems,
    openList: (kind: NavKind) => setListKind(kind),
    closeList: () => setListKind(null),
    pick,
    barKind,
    barIndex,
    barTotal: () => barIds().length,
    next: () => step(1),
    previous: () => step(-1),
    closeBar,
    versionsOpen,
    openVersions: () => setVersionsOpen(true),
    closeVersions: () => setVersionsOpen(false),
  };
}

export type ReviewNavigation = ReturnType<typeof useReviewNavigation>;
