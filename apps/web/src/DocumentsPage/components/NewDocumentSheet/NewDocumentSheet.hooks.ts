import { useReview } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { editPath, navigate } from '@/router/router';
import { blankDocument, idFromTitle, isValidId } from './newDocument.utils';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Estado de la hoja «Nuevo documento»: pide título e id, guarda un borrador con
 * una sección y abre el editor. Nada se publica hasta que se publique desde el editor.
 */
export function useNewDocumentSheet({ close }: { close: () => void }) {
  const review = useReview();
  const [title, setTitle] = createSignal('');
  // Mientras no se toque el id a mano, sigue al título.
  const [typedId, setTypedId] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal('');

  const id = () => typedId() ?? idFromTitle(title());
  const exists = () =>
    (review.documents() ?? []).some((document) => document.id === id());
  const idProblem = () => {
    if (!id()) return '';
    if (!isValidId(id())) return 'Solo minúsculas, números y guiones.';
    if (exists()) return 'Ya hay un documento con ese id.';
    return '';
  };
  const createDisabled = () =>
    busy() || !title().trim() || !isValidId(id()) || exists();

  async function create() {
    if (createDisabled()) return;
    setBusy(true);
    setError('');
    const result = await review.saveDraft(
      blankDocument(id(), title().trim(), today()),
      0,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    navigate(editPath(id()));
  }

  return {
    title,
    setTitle,
    id,
    setId: setTypedId,
    idProblem,
    error,
    busy,
    createDisabled,
    create,
    close,
  };
}
