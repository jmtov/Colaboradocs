import type { Slide } from '@colaboradocs/deck-core';
import { renderSlides } from '@colaboradocs/deck-render';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import { diffSlides } from '@/DeckEditor/features/deck/deck.utils';
import { inlineFiles } from '@/DeckPage/deck.utils';
import { buildPreviewHtml } from './preview.utils';
import { viewStore } from './view.store';

/**
 * Mantiene la vista previa: reemplaza solo las slides que cambian (sin recargar ni repetir las
 * animaciones de entrada) y rehace todo si cambia el tema, la variante o la estructura. Sigue la
 * slide que el deck muestra y lleva el deck a la que se elige en la lista.
 */
export function usePreview() {
  const [frame, setFrame] = createSignal<HTMLIFrameElement>();
  const [error, setError] = createSignal<string>();
  let lastSlides: Slide[] | undefined;
  let lastKey = '';

  const post = (message: unknown) =>
    frame()?.contentWindow?.postMessage(message, '*');

  function rebuild(slides: Slide[]) {
    const theme = deckStore.theme();
    if (!theme) return;
    const deck = { ...JSON.parse(JSON.stringify(deckStore.deck)), slides };
    const html = buildPreviewHtml(deck, theme, deckStore.files());
    const target = frame();
    if (target) target.srcdoc = html;
  }

  createEffect(() => {
    const slides = deckStore.previewSlides();
    const theme = deckStore.theme();
    const key = JSON.stringify([
      deckStore.deck.theme,
      deckStore.deck.variant,
      deckStore.deck.style,
      deckStore.deck.engine,
      theme?.id,
    ]);
    if (!frame() || !theme) return;
    try {
      const diff =
        lastSlides && key === lastKey
          ? diffSlides(lastSlides, slides)
          : ({ mode: 'rebuild' } as const);
      if (diff.mode === 'rebuild') rebuild(slides);
      else if (diff.mode === 'replace') {
        const html = renderSlides(
          { ...JSON.parse(JSON.stringify(deckStore.deck)), slides },
          { preview: true },
        );
        for (const index of diff.indexes)
          post({
            deckReplace: {
              index,
              html: inlineFiles(html[index] ?? '', deckStore.files()),
            },
          });
      }
      setError(undefined);
      lastSlides = slides;
      lastKey = key;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  });

  // «Ver celdas»: se avisa al cambiar y al cargar de nuevo la página.
  const postCells = () => post({ deckCells: viewStore.showCells() });
  createEffect(postCells);

  // el bloque señalado en la lista se resalta en la vista previa
  createEffect(() => post({ deckHighlight: viewStore.hoverBlock() }));

  // La lista de slides lleva el deck a la slide elegida.
  createEffect(() => {
    const index = deckStore.slideIndex();
    if (lastSlides) post({ deckGo: index + 1 });
  });

  const onMessage = (e: MessageEvent) => {
    if (e.source !== frame()?.contentWindow) return;
    const n: unknown = e.data?.deckSlide;
    if (typeof n === 'number' && n - 1 !== deckStore.slideIndex())
      deckStore.select(n - 1);
    const block: unknown = e.data?.deckBlock;
    if (typeof block === 'number')
      viewStore.requestOpen(deckStore.slideIndex(), block);
    const doomed: unknown = e.data?.deckDelete;
    if (typeof doomed === 'number')
      deckStore.remove(['slides', deckStore.slideIndex(), 'body', doomed]);
    const add = e.data?.deckAdd as { col?: unknown; row?: unknown } | undefined;
    if (typeof add?.col === 'number' && typeof add?.row === 'number')
      viewStore.requestAdd(deckStore.slideIndex(), add.col, add.row);
    if (e.data && 'deckHover' in e.data) {
      const hover: unknown = e.data.deckHover;
      viewStore.setHoverBlock(typeof hover === 'number' ? hover : null);
    }
  };
  onMount(() => window.addEventListener('message', onMessage));
  onCleanup(() => window.removeEventListener('message', onMessage));

  // Al cargar el iframe (srcdoc no lleva hash): «ver celdas» y la slide elegida.
  const onLoad = () => {
    postCells();
    post({ deckGo: deckStore.slideIndex() + 1 });
  };

  return { setFrame, error, onLoad };
}
