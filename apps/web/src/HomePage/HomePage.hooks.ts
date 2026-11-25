import type { DocumentListItem } from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createEffect, createSignal } from 'solid-js';
import UploadSheet from '@/DocumentsPage/components/UploadSheet/UploadSheet';
import NewDeckSheet from '@/NewDeckSheet/NewDeckSheet';

/** Estado y acciones de la home: si quien mira es admin, si hay conexión, los archivados (solo admins) y subir un documento nuevo. */
export function useHomePage(documents: () => DocumentListItem[]) {
  const review = useReview();
  const overlay = useOverlay();
  const [archived, setArchived] = createSignal<DocumentListItem[]>([]);

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
    archived,
    offline: () => review.status() === 'error',
    openNewDeck: () => void overlay.sheet(NewDeckSheet, {}),
    openUpload: () => void overlay.sheet(UploadSheet, { target: {} }),
  };
}
