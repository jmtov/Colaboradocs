import { useReview } from '@juntanza/review-ui';
import { createEffect, createSignal, untrack } from 'solid-js';
import {
  documentsOpen,
  setDocumentsOpen,
  setUploadTarget,
  uploadTarget,
} from './documentsSheet.state';

/** Estado, efectos y acciones de la hoja de administración de documentos. */
export function useDocumentsSheet() {
  const review = useReview();
  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Solo depende de abrir o cerrar la hoja. Si siguiera a `isAdmin()` (que lee la
  // revisión), cada recarga de la revisión volvería a pedir la lista, sin fin.
  createEffect(() => {
    if (documentsOpen()) {
      if (untrack(isAdmin)) void review.loadDocuments();
    } else {
      setConfirming(null);
    }
  });

  async function archive(id: string) {
    setBusy(true);
    const result = await review.archiveDocument(id);
    setBusy(false);
    setConfirming(null);
    review.flash(result.ok ? 'Documento archivado.' : result.message);
  }

  return {
    isAdmin,
    open: documentsOpen,
    uploadTarget,
    documents: () => review.documents() ?? [],
    confirming,
    busy,
    close: () => setDocumentsOpen(false),
    startUpload: () => setUploadTarget({}),
    startReplace: (id: string) => setUploadTarget({ replaceId: id }),
    closeUpload: () => setUploadTarget(null),
    askArchive: (id: string) => setConfirming(id),
    cancelArchive: () => setConfirming(null),
    archive,
  };
}
