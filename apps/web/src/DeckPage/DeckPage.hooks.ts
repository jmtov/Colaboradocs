import type { Theme } from '@colaboradocs/deck-core';
import { ApiRequestError, useReview } from '@colaboradocs/review-ui';
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import {
  blobToDataUrl,
  buildDeckHtml,
  type DeckFiles,
  themeFontFiles,
} from './deck.utils';

type FetchFile = (path: string) => Promise<Blob>;

async function loadAll(
  names: string[],
  fetchBlob: (name: string) => Promise<Blob>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    names.map(
      async (name) =>
        [name, await blobToDataUrl(await fetchBlob(name))] as const,
    ),
  );
  return Object.fromEntries(entries);
}

/**
 * Baja con el token las fuentes de los temas y los archivos del deck (el iframe no puede
 * mandarlo) y los devuelve como data URIs, listos para incrustar.
 */
export async function loadDeckFiles(
  fetchFile: FetchFile,
  themes: Theme[],
  deckId: string,
  deckFiles: string[],
): Promise<DeckFiles> {
  const fonts: Record<string, string> = {};
  const [files] = await Promise.all([
    loadAll(deckFiles, (path) => fetchFile(`/decks/${deckId}/files/${path}`)),
    ...themes.map(async (theme) => {
      Object.assign(
        fonts,
        await loadAll(themeFontFiles(theme), (file) =>
          fetchFile(`/themes/${theme.id}/files/${file}`),
        ),
      );
    }),
  ]);
  return { fonts, files };
}

/** Pide el deck con su tema y lo deja como HTML completo, con todo incrustado. */
export function useDeckPage(id: () => string) {
  const review = useReview();
  const [html, { refetch }] = createResource(id, async (deckId) => {
    const bundle = await review.fetchDeck(deckId);
    const loaded = await loadDeckFiles(
      review.fetchFile,
      [bundle.theme],
      deckId,
      bundle.files,
    );
    return {
      html: buildDeckHtml(bundle, loaded),
      title: bundle.deck.title,
    };
  });
  const notFound = () => {
    const error: unknown = html.error;
    return error instanceof ApiRequestError && error.code === 'not_found';
  };
  // La slide que se está viendo: el iframe avisa cada vez que cambia (`deckSlide`, desde 1), y
  // sirve para abrir el editor en ella. El iframe es de otro origen, así que no se puede leer directo.
  const [slide, setSlide] = createSignal(1);
  let frame: HTMLIFrameElement | undefined;
  const onMessage = (event: MessageEvent) => {
    if (event.source !== frame?.contentWindow) return;
    const reported: unknown = event.data?.deckSlide;
    if (typeof reported === 'number') setSlide(reported);
  };
  onMount(() => window.addEventListener('message', onMessage));
  onCleanup(() => window.removeEventListener('message', onMessage));

  return {
    deck: html,
    refetch,
    notFound,
    slide,
    setFrame: (element: HTMLIFrameElement) => {
      frame = element;
    },
    /** Lleva el iframe a una slide (desde 1); sin número, lo deja donde está (la primera). */
    goTo: (target: number | undefined) => {
      if (target === undefined) return;
      frame?.contentWindow?.postMessage({ deckGo: target }, '*');
    },
  };
}

const BAR_HIDDEN_KEY = 'review:deck-bar-hidden';

function readBarHidden(): boolean {
  try {
    return localStorage.getItem(BAR_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Si la barra superior está oculta (para proyectar sin ella); se recuerda en este navegador. */
export function useBarHidden() {
  const [hidden, setHidden] = createSignal(readBarHidden());
  function set(next: boolean) {
    setHidden(next);
    try {
      localStorage.setItem(BAR_HIDDEN_KEY, next ? '1' : '0');
    } catch {
      // sin almacenamiento: se oculta igual, pero no se recuerda
    }
  }
  return { hidden, hide: () => set(true), show: () => set(false) };
}
