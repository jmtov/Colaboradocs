import type { ManagedReviewer } from '@juntanza/review-core';
import { createSignal } from 'solid-js';
import { useReview } from '../../../../../ReviewProvider/review.context';

type Options = {
  person: () => ManagedReviewer;
  close: () => void;
};

/** Estado y acciones de la hoja para editar a una persona. Se monta al abrirse. */
export function useEditPersonSheet(options: Options) {
  const review = useReview();
  const [draft, setDraft] = createSignal(options.person().municipality ?? '');
  const [busy, setBusy] = createSignal(false);

  async function save() {
    const value = draft().trim();
    if (!value || busy()) return;
    setBusy(true);
    const result = await review.access.setRole(options.person().id, value);
    setBusy(false);
    if (result.ok) options.close();
    else review.flash(result.message);
  }

  return {
    draft,
    busy,
    roleLabel: () => review.role.label,
    updateDraft: (value: string) => setDraft(value),
    canSave: () => !busy() && draft().trim() !== '',
    save: () => void save(),
  };
}
