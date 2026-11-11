import { useOverlay, useReview } from '@juntanza/review-ui';
import { createSignal, onMount } from 'solid-js';
import UploadSheet from './components/UploadSheet/UploadSheet';

/** Estado y acciones de la hoja de administración de documentos. Se monta al abrirse. */
export function useDocumentsSheet() {
  const review = useReview();
  const overlay = useOverlay();
  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Una vez por apertura (la hoja se monta al abrirse). No va en un efecto que siga a
  // `isAdmin()` (que lee la revisión): cada recarga volvería a pedir la lista, sin fin.
  onMount(() => {
    if (isAdmin()) void review.loadDocuments();
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
    documents: () => review.documents() ?? [],
    confirming,
    busy,
    startUpload: () => void overlay.sheet(UploadSheet, { target: {} }),
    startReplace: (id: string) =>
      void overlay.sheet(UploadSheet, { target: { replaceId: id } }),
    askArchive: (id: string) => setConfirming(id),
    cancelArchive: () => setConfirming(null),
    archive,
  };
}
