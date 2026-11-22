import { useReview } from '@colaboradocs/review-ui';
import { createResource, createSignal } from 'solid-js';
import { parseDeck } from '@/DeckEditor/features/deck/storage.utils';
import {
  idFromTitle,
  isValidId,
} from '@/DocumentsPage/components/NewDocumentSheet/newDocument.utils';
import { deckEditPath, navigate } from '@/router/router';
import { blankDeck } from './newDeck.utils';

/**
 * Estado de la hoja «Nueva presentación»: título, id y tema (o un JSON para partir de él). Crea la
 * presentación con una portada y abre el editor; un JSON importado queda como borrador, sin publicar.
 */
export function useNewDeckSheet({ close }: { close: () => void }) {
  const review = useReview();
  const [themes] = createResource(() => review.fetchThemes().catch(() => []));
  const [existing] = createResource(() => review.fetchDecks().catch(() => []));
  const [title, setTitle] = createSignal('');
  const [typedId, setTypedId] = createSignal<string | null>(null);
  const [typedTheme, setTypedTheme] = createSignal<string>();
  const [imported, setImported] = createSignal<
    { name: string } & ReturnType<typeof parseDeck>
  >();
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal('');

  const id = () => typedId() ?? idFromTitle(title());
  const themeId = () =>
    typedTheme() ?? imported()?.theme ?? themes()?.[0]?.id ?? '';
  const exists = () => (existing() ?? []).some((deck) => deck.id === id());
  const idProblem = () => {
    if (!id()) return '';
    if (!isValidId(id())) return 'Solo minúsculas, números y guiones.';
    if (exists()) return 'Ya hay una presentación con ese id.';
    return '';
  };
  const createDisabled = () =>
    busy() || !title().trim() || !isValidId(id()) || exists() || !themeId();

  async function onFile(file: File) {
    const deck = parseDeck(await file.text());
    if (!deck) {
      setError('El archivo no es un deck válido (versión 1).');
      return;
    }
    setError('');
    setImported({ ...deck, name: file.name });
    if (!title()) setTitle(deck.title);
  }

  async function create() {
    if (createDisabled()) return;
    setBusy(true);
    setError('');
    try {
      await review.putDeck(blankDeck(id(), title().trim(), themeId()));
      const source = imported();
      if (source) {
        // Lo importado puede estar a medias: va como borrador y se valida al publicar.
        const { name: _name, ...deck } = source;
        await review.saveDeckDraft({
          ...deck,
          id: id(),
          title: title().trim(),
          theme: themeId(),
        });
      }
      close();
      navigate(deckEditPath(id()));
    } catch {
      setError('No se pudo crear la presentación.');
    } finally {
      setBusy(false);
    }
  }

  return {
    themes,
    title,
    setTitle,
    id,
    setId: setTypedId,
    themeId,
    setThemeId: setTypedTheme,
    idProblem,
    imported,
    onFile,
    error,
    busy,
    createDisabled,
    create,
    close,
  };
}
