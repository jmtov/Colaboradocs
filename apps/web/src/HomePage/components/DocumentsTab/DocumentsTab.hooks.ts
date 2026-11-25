import {
  countKinds,
  type DocumentKind,
  type DocumentListItem,
  filterDocuments,
  sortDocuments,
} from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createEffect, createMemo, createSignal } from 'solid-js';
import UploadSheet from '@/DocumentsPage/components/UploadSheet/UploadSheet';
import FiltersSheet from '../FiltersSheet/FiltersSheet';

/** Estado y acciones del tab de documentos: los documentos ordenados y filtrados, los archivados (solo admins) y subir uno nuevo. */
export function useDocumentsTab(
  documents: () => DocumentListItem[],
  isAdmin: () => boolean,
) {
  const review = useReview();
  const overlay = useOverlay();
  const [archived, setArchived] = createSignal<DocumentListItem[]>([]);
  const [query, setQuery] = createSignal('');
  const [kind, setKind] = createSignal<DocumentKind | null>(null);
  const sorted = createMemo(() => sortDocuments(documents()));
  const kinds = createMemo(() => countKinds(documents()));
  // Si ya no queda ningún documento del tipo filtrado (p. ej. se archivó el último), el filtro se suelta.
  createEffect(() => {
    const current = kind();
    if (current && !kinds().some((entry) => entry.kind === current)) {
      setKind(null);
    }
  });
  const visible = createMemo(() =>
    filterDocuments(sorted(), { query: query(), kind: kind() }),
  );

  // Los archivados se piden al entrar y cada vez que cambia la lista (p. ej. tras archivar uno).
  createEffect(() => {
    documents();
    if (!isAdmin()) return;
    review
      .fetchArchivedDocuments()
      .then(setArchived)
      .catch(() => setArchived([]));
  });

  return {
    query,
    setQuery,
    setKind,
    kinds,
    visible,
    kindTitle: () =>
      kinds().find((entry) => entry.kind === kind())?.title ?? null,
    openFilters: async () => {
      const chosen = await overlay.sheet(FiltersSheet, {
        kind: kind(),
        kinds: kinds(),
      });
      if (chosen) setKind(chosen.kind);
    },
    clearFilter: () => {
      setQuery('');
      setKind(null);
    },
    archived,
    openUpload: () => void overlay.sheet(UploadSheet, { target: {} }),
  };
}
