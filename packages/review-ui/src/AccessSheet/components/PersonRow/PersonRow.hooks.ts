import type { ManagedReviewer } from '@juntanza/review-core';
import { type Accessor, createSignal } from 'solid-js';
import { useReview } from '../../../ReviewProvider/review.context';

type Confirm = 'pin' | 'remove' | null;

/** Estado, acciones y acceso a datos de una fila de persona. */
export function usePersonRow(person: Accessor<ManagedReviewer>) {
  const review = useReview();
  const access = review.access;
  const [confirm, setConfirm] = createSignal<Confirm>(null);
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  /** Corre una acción; si falla, avisa. */
  async function run(
    action: () => Promise<{ ok: true } | { ok: false; message: string }>,
    done?: string,
  ) {
    if (busy()) return;
    setBusy(true);
    const result = await action();
    setBusy(false);
    setConfirm(null);
    if (!result.ok) review.flash(result.message);
    else if (done) review.flash(done);
    return result.ok;
  }

  async function saveRole() {
    const value = draft().trim();
    if (!value) return;
    if (await run(() => access.setRole(person().id, value))) {
      setEditing(false);
    }
  }

  const role = () => {
    const municipality = person().municipality;
    return municipality ? review.role.format(municipality) : null;
  };

  return {
    role,
    roleLabel: () => review.role.label,
    confirm,
    editing,
    draft,
    busy,
    startEdit: () => {
      setDraft(person().municipality ?? '');
      setEditing(true);
    },
    cancelEdit: () => setEditing(false),
    updateDraft: (value: string) => setDraft(value),
    saveRole: () => void saveRole(),
    askConfirm: (kind: Exclude<Confirm, null>) => setConfirm(kind),
    cancelConfirm: () => setConfirm(null),
    toggleAdmin: (isAdmin: boolean) =>
      run(() => access.setAdmin(person().id, isAdmin)),
    resetDevices: () =>
      run(
        () => access.resetDevices(person().id),
        'Dispositivos restablecidos.',
      ),
    regeneratePin: () => run(() => access.regeneratePin(person().id)),
    removePerson: () => run(() => access.remove(person().id)),
  };
}
