import {
  formatReviewerLabel,
  groupApprovals,
  groupThreads,
  openThreadCount,
} from '@juntanza/review-core';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { useReview } from '../ReviewProvider/review.context';
import styles from './BlockLayer.module.css';

export function useBlockLayer() {
  const review = useReview();
  let root!: HTMLDivElement;
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [threadsOpen, setThreadsOpen] = createSignal(false);
  const [barHost, setBarHost] = createSignal<HTMLElement | null>(null);

  const approvalsByBlock = createMemo(() =>
    groupApprovals(review.snapshot()?.approvals ?? []),
  );
  const threadsByBlock = createMemo(() =>
    groupThreads(review.snapshot()?.comments ?? []),
  );

  function setRoot(element: HTMLDivElement) {
    root = element;
  }

  function findBlock(id: string): HTMLElement | null {
    return root.querySelector<HTMLElement>(
      `[data-block-id="${CSS.escape(id)}"]`,
    );
  }

  // Pinta insignias y selección directamente en los bloques.
  createEffect(() => {
    const approvals = approvalsByBlock();
    const threads = threadsByBlock();
    const me = review.snapshot()?.me.id;
    const selected = selectedId();
    for (const element of root.querySelectorAll<HTMLElement>(
      '[data-block-id]',
    )) {
      const id = element.dataset.blockId ?? '';
      const approvedBy = approvals.get(id) ?? [];
      const open = openThreadCount(threads.get(id) ?? []);
      const parts: string[] = [];
      if (approvedBy.length > 0) parts.push(`✓ ${approvedBy.length}`);
      if (open > 0) parts.push(`${open} ${open === 1 ? 'hilo' : 'hilos'}`);

      element.classList.add(styles.block);
      if (parts.length > 0) element.dataset.badge = parts.join(' · ');
      else delete element.dataset.badge;
      element.toggleAttribute('data-mine', !!me && approvedBy.includes(me));
      element.toggleAttribute('data-selected', id === selected);
    }
  });

  // Cada selección crea un contenedor justo después del bloque, para montar ahí la barra.
  createEffect(() => {
    const id = selectedId();
    const block = id ? findBlock(id) : null;
    if (!block) {
      setBarHost(null);
      return;
    }
    const host = document.createElement(block.tagName === 'LI' ? 'li' : 'div');
    host.className = styles.barHost ?? '';
    block.after(host);
    setBarHost(host);
    requestAnimationFrame(() =>
      host
        .querySelector('[data-review-bar]')
        ?.scrollIntoView({ block: 'nearest' }),
    );
    onCleanup(() => {
      setBarHost(null);
      host.remove();
    });
  });

  createEffect(() => {
    if (!selectedId()) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !threadsOpen()) setSelectedId(null);
    };
    document.addEventListener('keydown', onKey);
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });

  function onClick(event: MouseEvent) {
    const target = event.target as Element;
    if (target.closest('a, button, [data-interactive], [data-review-bar]'))
      return;
    if (window.getSelection()?.isCollapsed === false) return;
    const block = target.closest<HTMLElement>('[data-block-id]');
    const id = block?.dataset.blockId ?? null;
    setSelectedId((previous) => (previous === id ? null : id));
  }

  const blockText = () => {
    const id = selectedId();
    return (id && findBlock(id)?.textContent) || '';
  };
  const approvedNames = () => {
    const id = selectedId();
    const snapshot = review.snapshot();
    if (!id || !snapshot) return [];
    return (approvalsByBlock().get(id) ?? []).map((reviewerId) =>
      formatReviewerLabel(snapshot.reviewers[reviewerId]),
    );
  };
  const isMine = () => {
    const id = selectedId();
    const me = review.snapshot()?.me.id;
    return !!id && !!me && (approvalsByBlock().get(id) ?? []).includes(me);
  };
  const openThreadsFor = (id: string) =>
    openThreadCount(threadsByBlock().get(id) ?? []);
  const notice = () => review.notice();

  return {
    setRoot,
    onClick,
    selectedId,
    barHost,
    threadsOpen,
    blockText,
    approvedNames,
    isMine,
    openThreadsFor,
    notice,
    openComments: () => setThreadsOpen(true),
    closeComments: () => setThreadsOpen(false),
    clearSelection: () => setSelectedId(null),
    toggleApproval: (id: string) => review.toggleApproval(id),
  };
}
