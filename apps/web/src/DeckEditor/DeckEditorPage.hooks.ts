import type { Deck } from '@colaboradocs/deck-core';
import { ApiRequestError, useReview } from '@colaboradocs/review-ui';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { unwrap } from 'solid-js/store';
import { loadDeckFiles } from '@/DeckPage/DeckPage.hooks';
import { deckPath, navigate } from '@/router/router';
import { cloneJson } from './features/deck/clone.utils';
import { deckStore } from './features/deck/deck.store';
import { migrateDeck, serializeDeck } from './features/deck/storage.utils';

/** Espera tras el último cambio antes de guardar el borrador. */
const SAVE_DELAY_MS = 800;

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export type EditorActions = {
  saveState: () => SaveState;
  /** Por qué no se pudo publicar (o guardar), listo para mostrar. */
  error: () => string | undefined;
  publishing: () => boolean;
  back: () => void;
  publish: () => void;
  discard: () => void;
};

/** Deshacer y rehacer con Cmd/Ctrl+Z y Cmd/Ctrl+Mayús+Z, salvo dentro de un campo de texto (que tiene el suyo). */
function useShortcuts() {
  const onKey = (e: KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
    const target = e.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    e.preventDefault();
    if (e.shiftKey) deckStore.redo();
    else deckStore.undo();
  };
  onMount(() => window.addEventListener('keydown', onKey));
  onCleanup(() => window.removeEventListener('keydown', onKey));
}

const explain = (error: unknown): string => {
  if (error instanceof ApiRequestError && error.details.length > 0) {
    const [first, ...rest] = error.details;
    return rest.length > 0 ? `${first} (y ${rest.length} más)` : String(first);
  }
  return 'No se pudo completar. Revisa la conexión.';
};

/**
 * Abre la presentación en el editor (el borrador si hay, si no lo publicado), guarda el borrador
 * solo mientras se edita y publica o descarta a pedido.
 */
export function useDeckEditorPage(id: () => string) {
  useShortcuts();
  const review = useReview();
  const [saveState, setSaveState] = createSignal<SaveState>('idle');
  const [error, setError] = createSignal<string>();
  const [publishing, setPublishing] = createSignal(false);
  let baseline = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const [opened, { refetch }] = createResource(id, async (deckId) => {
    const [bundle, draft, themes] = await Promise.all([
      review.fetchDeck(deckId),
      review.fetchDeckDraft(deckId),
      review.fetchThemes(),
    ]);
    const files = await loadDeckFiles(
      review.fetchFile,
      themes,
      deckId,
      bundle.files,
    );
    deckStore.open(migrateDeck(draft?.content ?? bundle.deck), themes, files);
    baseline = serializeDeck(deckStore.deck);
    setSaveState(draft ? 'saved' : 'idle');
    return deckId;
  });
  const notFound = () => {
    const failure: unknown = opened.error;
    return failure instanceof ApiRequestError && failure.code === 'not_found';
  };

  async function save() {
    clearTimeout(timer);
    const text = serializeDeck(deckStore.deck);
    if (text === baseline) return;
    setSaveState('saving');
    try {
      await review.saveDeckDraft(cloneJson(unwrap(deckStore.deck)) as Deck);
      baseline = text;
      setError(undefined);
      setSaveState('saved');
    } catch (failure) {
      setError(explain(failure));
      setSaveState('error');
    }
  }

  // Cada cambio reinicia la espera; `createMemo` hace que solo corra cuando el deck cambia de verdad.
  const text = createMemo(() =>
    opened() ? serializeDeck(deckStore.deck) : '',
  );
  createEffect(() => {
    if (!opened() || text() === baseline) return;
    clearTimeout(timer);
    timer = setTimeout(() => void save(), SAVE_DELAY_MS);
  });
  onCleanup(() => clearTimeout(timer));

  const actions: EditorActions = {
    saveState,
    error,
    publishing,
    back: () => {
      void save().then(() => navigate('/'));
    },
    publish: () => {
      setPublishing(true);
      void (async () => {
        await save();
        if (saveState() === 'error') return;
        try {
          await review.publishDeckDraft(id());
          navigate(deckPath(id()));
        } catch (failure) {
          setError(`No se puede publicar: ${explain(failure)}`);
        } finally {
          setPublishing(false);
        }
      })();
    },
    discard: () => {
      if (!window.confirm('¿Descartar los cambios sin publicar?')) return;
      void review
        .discardDeckDraft(id())
        .then(() => refetch())
        .then(() => setError(undefined))
        .catch((failure: unknown) => setError(explain(failure)));
    },
  };

  return { opened, notFound, refetch, actions };
}
