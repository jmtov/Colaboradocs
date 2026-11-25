import { createSignal } from 'solid-js';
import { unwrap } from 'solid-js/store';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import {
  parseDeck,
  serializeDeck,
} from '@/deck/DeckEditorPage/features/deck/storage.utils';

export function useDeckFiles() {
  const [importInput, setImportInput] = createSignal<HTMLInputElement>();
  const [message, setMessage] = createSignal<string>();

  const say = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(undefined), 4000);
  };

  function exportDeck() {
    const blob = new Blob([serializeDeck(unwrap(deckStore.deck))], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckStore.deck.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    const deck = parseDeck(await file.text());
    if (!deck) return say('El archivo no es un deck válido (versión 1).');
    // El id es el de esta presentación: un JSON de otra no la renombra.
    deckStore.replaceDeck({ ...deck, id: deckStore.deck.id });
    say(`Importado: ${deck.slides.length} slides.`);
  }

  return { importInput, setImportInput, onImport, exportDeck, message };
}
