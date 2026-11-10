import {
  formatReviewerLabel,
  groupApprovals,
  groupThreads,
  openThreadCount,
} from '@juntanza/review-core';
import {
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import BlockActionBar from '../BlockActionBar/BlockActionBar';
import { useReview } from '../ReviewProvider/review.context';
import ThreadSheet from '../ThreadSheet/ThreadSheet';
import styles from './BlockLayer.module.css';

type Props = {
  /** Contenido con elementos `data-block-id` (uno por bloque revisable). */
  children: JSX.Element;
};

/**
 * Hace revisable el contenido de sus hijos: al tocar un bloque aparece la barra
 * de Comentar / OK, y cada bloque muestra cuántos OK e hilos abiertos tiene.
 * Los elementos con `data-interactive`, enlaces y botones no seleccionan.
 */
export default function BlockLayer(props: Props) {
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

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: la selección por teclado se resuelve con los botones de la barra */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: delegación de clics sobre el contenido */}
      <div ref={root} class={styles.layer} onClick={onClick}>
        {props.children}
      </div>
      <Show when={selectedId()}>
        {(id) => (
          <>
            <Show when={barHost()}>
              {(host) => (
                <Portal mount={host()}>
                  <BlockActionBar
                    approvedBy={approvedNames()}
                    mine={isMine()}
                    openThreads={openThreadCount(
                      threadsByBlock().get(id()) ?? [],
                    )}
                    onComment={() => setThreadsOpen(true)}
                    onToggleApproval={() => review.toggleApproval(id())}
                    onClose={() => setSelectedId(null)}
                  />
                </Portal>
              )}
            </Show>
            <ThreadSheet
              open={threadsOpen()}
              blockId={id()}
              blockText={blockText()}
              onClose={() => setThreadsOpen(false)}
            />
          </>
        )}
      </Show>
      <Show when={review.notice()}>
        {(message) => (
          <p class={styles.notice} role="alert">
            {message()}
          </p>
        )}
      </Show>
    </>
  );
}
