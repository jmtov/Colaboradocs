import { type Accessor, createEffect, createSignal } from 'solid-js';
import { useReview } from '../../../ReviewProvider/review.context';

/** Estado, validación y envío del formulario de alta de persona. */
export function useAddPersonSheet(
  open: Accessor<boolean>,
  onClose: () => void,
) {
  const review = useReview();
  const [name, setName] = createSignal('');
  const [role, setRole] = createSignal('');
  const [isAdmin, setIsAdmin] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!open()) return;
    setName('');
    setRole('');
    setIsAdmin(false);
    setError(null);
  });

  const valid = () => name().trim() !== '' && role().trim() !== '';

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!valid() || busy()) return;
    setBusy(true);
    setError(null);
    const result = await review.access.add({
      name: name(),
      municipality: role(),
      isAdmin: isAdmin(),
    });
    setBusy(false);
    if (result.ok) onClose();
    else setError(result.message);
  }

  return {
    name,
    role,
    isAdmin,
    busy,
    error,
    valid,
    roleLabel: () => review.role.label,
    updateName: (value: string) => setName(value),
    updateRole: (value: string) => setRole(value),
    updateIsAdmin: (checked: boolean) => setIsAdmin(checked),
    submit,
  };
}
