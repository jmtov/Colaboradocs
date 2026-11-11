import {
  groupApprovals,
  groupThreads,
  openThreadCount,
} from '@colaboradocs/review-core';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import ApprovalsSheet from '../ApprovalsSheet/ApprovalsSheet';
import { useOverlay } from '../overlay/useOverlay';
import { useReview } from '../ReviewProvider/review.context';
import ThreadSheet from '../ThreadSheet/ThreadSheet';
import styles from './BlockLayer.module.css';

export function useBlockLayer() {
  const review = useReview();
  const overlay = useOverlay();
  let root!: HTMLDivElement;
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [barHost, setBarHost] = createSignal<HTMLElement | null>(null);
  // Los bloques del contenido por id: ahí se montan las pastillas de OK e hilos.
  const [blocks, setBlocks] = createSignal(new Map<string, HTMLElement>());

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

  onMount(() => {
    const found = new Map<string, HTMLElement>();
    for (const element of root.querySelectorAll<HTMLElement>(
      '[data-block-id]',
    )) {
      found.set(element.dataset.blockId ?? '', element);
    }
    setBlocks(found);
  });

  // Pinta la selección directamente en los bloques (las pastillas son componentes, abajo).
  createEffect(() => {
    const selected = selectedId();
    for (const element of root.querySelectorAll<HTMLElement>(
      '[data-block-id]',
    )) {
      const id = element.dataset.blockId ?? '';
      element.classList.add(styles.block);
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
      if (event.key === 'Escape' && !overlay.isOpen()) setSelectedId(null);
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

  const approvalCount = (id: string) => approvalsByBlock().get(id)?.length ?? 0;
  const isMine = (id: string) => {
    const me = review.snapshot()?.me.id;
    return !!me && (approvalsByBlock().get(id) ?? []).includes(me);
  };
  /** Los bloques que llevan pastillas: con algún OK o algún hilo abierto, en orden. */
  const badgedIds = createMemo(() =>
    [...blocks().keys()].filter(
      (id) => approvalCount(id) > 0 || openThreadsFor(id) > 0,
    ),
  );
  const textOf = (id: string) => findBlock(id)?.textContent ?? '';
  const openThreadsFor = (id: string) =>
    openThreadCount(threadsByBlock().get(id) ?? []);
  const notice = () => review.notice();

  return {
    setRoot,
    onClick,
    selectedId,
    barHost,
    badgedIds,
    blockElement: (id: string) => blocks().get(id),
    approvalCount,
    isMine,
    openThreadsFor,
    notice,
    openComments: (id: string) =>
      void overlay.sheet(ThreadSheet, { blockId: id, blockText: textOf(id) }),
    openApprovals: (id: string) =>
      void overlay.sheet(ApprovalsSheet, {
        blockId: id,
        blockText: textOf(id),
      }),
    clearSelection: () => setSelectedId(null),
    toggleApproval: (id: string) => review.toggleApproval(id),
  };
}
