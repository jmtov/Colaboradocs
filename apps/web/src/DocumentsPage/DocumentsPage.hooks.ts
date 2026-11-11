import { useOverlay, useReview } from '@juntanza/review-ui';
import { createSignal, onMount } from 'solid-js';
import UploadSheet from './components/UploadSheet/UploadSheet';

/** Estado y acciones de la página de administración de documentos. */
export function useDocumentsPage() {
  const review = useReview();
  const overlay = useOverlay();
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Una vez al entrar a la página (solo se monta para admins). No va en un efecto que siga
  // a la revisión: cada recarga volvería a pedir la lista, sin fin.
  onMount(() => void review.loadDocuments());

  async function archive(id: string) {
    setBusy(true);
    const result = await review.archiveDocument(id);
    setBusy(false);
    setConfirming(null);
    review.flash(result.ok ? 'Documento archivado.' : result.message);
  }

  return {
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
