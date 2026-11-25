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
import NewDeckSheet from '@/NewDeckSheet/NewDeckSheet';
import FiltersSheet from './components/FiltersSheet/FiltersSheet';

/** Estado y acciones de la home: los documentos ordenados y filtrados, si quien mira es admin, si hay conexión, los archivados (solo admins) y subir un documento nuevo. */
export function useHomePage(documents: () => DocumentListItem[]) {
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

  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;

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
    isAdmin,
    query,
    setQuery,
    kind,
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
    offline: () => review.status() === 'error',
    openNewDeck: () => void overlay.sheet(NewDeckSheet, {}),
    openUpload: () => void overlay.sheet(UploadSheet, { target: {} }),
  };
}
