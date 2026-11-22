import {
  applyTestCase,
  type Deck,
  defaultSlide,
  type Issue,
  resolveStyle,
  type Slide,
  type TestCaseId,
  type Theme,
  validateDeck,
  validateTheme,
} from '@colaboradocs/deck-core';
import { createMemo, createRoot, createSignal } from 'solid-js';
import { createStore, produce, reconcile, unwrap } from 'solid-js/store';
import type { DeckFiles } from '@/DeckPage/deck.utils';
import { deleteIn, insertAt, moveAt, type Path, setIn } from './deck.utils';
import {
  emptyHistory,
  type History,
  record,
  redo,
  undo,
} from './history.utils';

const COALESCE_MS = 1000;

const copy = <T>(value: T): T => structuredClone(value);

const emptyDeck = (): Deck => ({
  version: 1,
  id: '',
  title: '',
  lang: 'es',
  theme: '',
  slides: [],
});

function createDeckStore() {
  // Vacío hasta `open`: el deck llega de la API al abrir la página del editor.
  const [deck, setDeck] = createStore<Deck>(emptyDeck());
  /** Los temas de la base, por id (el editor cambia de tema sin pedirlos otra vez). */
  const [themes, setThemes] = createSignal<Record<string, Theme>>({});
  /** Fuentes y archivos del deck ya bajados (data URIs) para la vista previa. */
  const [files, setFiles] = createSignal<DeckFiles>({ fonts: {}, files: {} });
  const [history, setHistory] = createSignal<History<Deck>>(emptyHistory());
  const [slideIndex, setSlideIndex] = createSignal(0);
  /** Caso de prueba que se ve en la vista previa de la slide actual; no cambia el deck. */
  const [testCase, setTestCase] = createSignal<TestCaseId | null>(null);
  let lastKey: string | undefined;
  let lastAt = 0;

  const snapshot = (): Deck => copy(unwrap(deck));

  /** Todo cambio pasa por aquí: guarda la historia y aplica el cambio sobre un borrador. */
  function mutate(change: (draft: Deck) => void, coalesceKey?: string) {
    const now = Date.now();
    const merge =
      coalesceKey !== undefined &&
      coalesceKey === lastKey &&
      now - lastAt < COALESCE_MS;
    if (!merge) setHistory((h) => record(h, snapshot()));
    lastKey = coalesceKey;
    lastAt = now;
    setDeck(produce(change));
  }

  const theme = createMemo(() => themes()[deck.theme]);
  const issues = createMemo<Issue[]>(() => {
    const t = theme();
    return t
      ? [...validateTheme(t), ...validateDeck(deck, t)]
      : [{ path: 'theme', message: `Tema desconocido: «${deck.theme}».` }];
  });
  const categoryCount = createMemo(() => {
    const t = theme();
    return t ? resolveStyle(t, deck.variant, deck.style).categories.length : 0;
  });

  const clamp = (i: number) => Math.max(0, Math.min(deck.slides.length - 1, i));

  return {
    deck,
    issues,
    theme,
    categoryCount,
    history,
    slideIndex,
    testCase,
    setTestCase,
    select: (i: number) => {
      setSlideIndex(clamp(i));
      setTestCase(null);
    },
    set: (path: Path, value: unknown, coalesceKey?: string) =>
      mutate((d) => setIn(d, path, value), coalesceKey),
    /** Cambia varios campos de un objeto a la vez (un solo paso del historial); `undefined` quita el campo. */
    patch: (path: Path, values: Record<string, unknown>) =>
      mutate((d) => {
        for (const [key, value] of Object.entries(values)) {
          if (value === undefined) deleteIn(d, [...path, key]);
          else setIn(d, [...path, key], value);
        }
      }),
    remove: (path: Path) => mutate((d) => deleteIn(d, path)),
    insert: (path: Path, index: number, item: unknown) =>
      mutate((d) => {
        const list = path.length
          ? (path.reduce<unknown>(
              (n, k) => (n as Record<string | number, unknown>)[k],
              d,
            ) as unknown[])
          : [];
        insertAt(list, index, item);
      }),
    move: (path: Path, from: number, to: number) =>
      mutate((d) => {
        moveAt(
          path.reduce<unknown>(
            (n, k) => (n as Record<string | number, unknown>)[k],
            d,
          ) as unknown[],
          from,
          to,
        );
      }),
    /** Agrega una slide nueva (de una plantilla) después de la de la posición `after` (por omisión, la actual) y la selecciona. */
    addSlide: (templateId: string, after = slideIndex()) => {
      const at = after + 1;
      const slide = defaultSlide(templateId);
      mutate((d) => insertAt(d.slides, at, slide));
      setSlideIndex(at);
      setTestCase(null);
    },
    duplicateSlide: (index: number) => {
      mutate((d) =>
        insertAt(d.slides, index + 1, copy(unwrap(d.slides[index]) as Slide)),
      );
      setSlideIndex(index + 1);
      setTestCase(null);
    },
    removeSlide: (index: number) => {
      if (deck.slides.length <= 1) return;
      mutate((d) => d.slides.splice(index, 1));
      setSlideIndex(
        clamp(slideIndex() > index ? slideIndex() - 1 : slideIndex()),
      );
      setTestCase(null);
    },
    /** Mueve la slide de `from` a `to`; si era la elegida, la selección la sigue. */
    moveSlide: (from: number, to: number) => {
      if (to < 0 || to >= deck.slides.length || from === to) return;
      mutate((d) => moveAt(d.slides, from, to));
      if (slideIndex() === from) setSlideIndex(to);
    },
    setTheme: (id: string) =>
      mutate((d) => {
        d.theme = id;
        d.variant = undefined;
      }),
    setVariant: (id: string | undefined) =>
      mutate((d) => {
        d.variant = id;
      }),
    undo: () => {
      const result = undo(history(), snapshot());
      if (!result) return;
      setDeck(reconcile(result.value));
      setHistory(result.history);
      lastKey = undefined;
    },
    redo: () => {
      const result = redo(history(), snapshot());
      if (!result) return;
      setDeck(reconcile(result.value));
      setHistory(result.history);
      lastKey = undefined;
    },
    replaceDeck: (next: Deck) => {
      setHistory((h) => record(h, snapshot()));
      setDeck(reconcile(copy(next)));
      setSlideIndex(0);
      setTestCase(null);
    },
    /** Abre un deck con los temas disponibles: empieza de cero (sin historial ni slide elegida). */
    open: (next: Deck, available: Theme[], loaded: DeckFiles) => {
      setFiles(loaded);
      setThemes(
        Object.fromEntries(available.map((t): [string, Theme] => [t.id, t])),
      );
      setDeck(reconcile(copy(next)));
      setHistory(emptyHistory<Deck>());
      setSlideIndex(0);
      setTestCase(null);
      lastKey = undefined;
    },
    files,
    /** Los temas disponibles, en orden. */
    themes: () => Object.values(themes()),
    /** La slide tal como se dibuja en la vista previa (con el caso de prueba, si hay uno). */
    previewSlides: (): Slide[] => {
      const slides: Slide[] = JSON.parse(JSON.stringify(deck.slides));
      const id = testCase();
      const at = slideIndex();
      const current = slides[at];
      if (id && current) slides[at] = applyTestCase(current, id);
      return slides;
    },
  };
}

export const deckStore = createRoot(createDeckStore);
