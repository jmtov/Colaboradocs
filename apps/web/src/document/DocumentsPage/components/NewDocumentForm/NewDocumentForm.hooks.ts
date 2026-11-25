import type { DocumentKind } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { editPath, navigate } from '@/shared/router/router';
import { idFromTitle, isValidId } from '@/shared/utils/id.utils';
import { blankDocument } from './newDocument.utils';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Estado del formulario «Crear desde cero»: pide título e id, guarda un borrador con
 * una sección y abre el editor. Nada se publica hasta que se publique desde el editor.
 * `onCreated` cierra la hoja que lo contiene.
 */
export function useNewDocumentForm({ onCreated }: { onCreated: () => void }) {
  const review = useReview();
  const [title, setTitle] = createSignal('');
  const [type, setType] = createSignal<DocumentKind>('other');
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
      blankDocument(id(), title().trim(), today(), type()),
      0,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated();
    navigate(editPath(id()));
  }

  return {
    title,
    setTitle,
    type,
    setType,
    id,
    setId: setTypedId,
    idProblem,
    error,
    busy,
    createDisabled,
    create,
  };
}
