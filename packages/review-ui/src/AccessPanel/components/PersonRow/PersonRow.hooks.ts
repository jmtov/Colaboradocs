import type { ManagedReviewer } from '@juntanza/review-core';
import { type Accessor, createSignal } from 'solid-js';
import { useOverlay } from '../../../overlay/useOverlay';
import { useReview } from '../../../ReviewProvider/review.context';
import type { AccessOutcome } from '../../../store/createAccessStore';
import PinResultSheet from '../PinResultSheet/PinResultSheet';

type Confirm = 'pin' | 'remove' | null;

/** Estado, acciones y acceso a datos de una fila de persona. */
export function usePersonRow(person: Accessor<ManagedReviewer>) {
  const review = useReview();
  const overlay = useOverlay();
  const access = review.access;
  const [confirm, setConfirm] = createSignal<Confirm>(null);
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  /** Corre una acción; si falla, avisa. Devuelve su resultado, o null si ya había otra en curso. */
  async function run<T>(
    action: () => Promise<AccessOutcome<T>>,
    done?: string,
  ): Promise<AccessOutcome<T> | null> {
    if (busy()) return null;
    setBusy(true);
    const result = await action();
    setBusy(false);
    setConfirm(null);
    if (!result.ok) review.flash(result.message);
    else if (done) review.flash(done);
    return result;
  }

  async function saveRole() {
    const value = draft().trim();
    if (!value) return;
    const result = await run(() => access.setRole(person().id, value));
    if (result?.ok) setEditing(false);
  }

  async function regeneratePin() {
    const result = await run(() => access.regeneratePin(person().id));
    if (result?.ok)
      void overlay.sheet(PinResultSheet, { issued: result.value });
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
    regeneratePin: () => void regeneratePin(),
    removePerson: () => run(() => access.remove(person().id)),
  };
}
