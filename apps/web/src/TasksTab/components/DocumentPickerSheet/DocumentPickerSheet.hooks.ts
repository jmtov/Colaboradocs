import { matchesQuery } from '@colaboradocs/review-core';
import { createMemo, createSignal } from 'solid-js';
import type { DocumentPickerSheetProps } from './DocumentPickerSheet.types';

/** La búsqueda y lo marcado en la hoja de documentos (parte de lo que ya estaba elegido). */
export function useDocumentPickerSheet(props: DocumentPickerSheetProps) {
  const [query, setQuery] = createSignal('');
  const [chosen, setChosen] = createSignal<ReadonlySet<string>>(
    new Set(props.selected),
  );
  const shown = createMemo(() =>
    props.documents.filter((item) => matchesQuery(query(), [item.title])),
  );

  return {
    query,
    setQuery,
    shown,
    isChosen: (id: string) => chosen().has(id),
    count: () => chosen().size,
    toggle: (id: string) =>
      setChosen((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    clear: () => setChosen(new Set<string>()),
    /** Lo elegido, en el orden de la lista. */
    apply: () =>
      props.close(
        props.documents
          .filter((item) => chosen().has(item.id))
          .map((item) => item.id),
      ),
  };
}
