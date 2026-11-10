import { MAX_NAME_LENGTH, MAX_ROLE_LENGTH } from '@juntanza/review-core';
import { createEffect, createSignal, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import { useReview } from '../ReviewProvider/review.context';
import styles from './AddPersonSheet.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddPersonSheet(props: Props) {
  const review = useReview();
  const [name, setName] = createSignal('');
  const [role, setRole] = createSignal('');
  const [isAdmin, setIsAdmin] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.open) return;
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
    if (result.ok) props.onClose();
    else setError(result.message);
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Accesos"
      title="Agregar persona"
      compact
      onClose={props.onClose}
    >
      <form class={styles.form} onSubmit={submit}>
        <label class={styles.label}>
          Nombre
          <input
            class={styles.field}
            required
            maxLength={MAX_NAME_LENGTH}
            autocomplete="off"
            value={name()}
            onInput={(event) => setName(event.currentTarget.value)}
          />
        </label>
        <label class={styles.label}>
          {review.role.label}
          <input
            class={styles.field}
            required
            maxLength={MAX_ROLE_LENGTH}
            autocomplete="off"
            value={role()}
            onInput={(event) => setRole(event.currentTarget.value)}
          />
        </label>
        <label class={styles.switch}>
          <input
            type="checkbox"
            checked={isAdmin()}
            onChange={(event) => setIsAdmin(event.currentTarget.checked)}
          />
          Administrador
          <span class={styles.help}>
            Puede agregar y quitar personas, salvo a quien le dio acceso.
          </span>
        </label>
        <Show when={error()}>
          <p class={styles.error} role="alert">
            {error()}
          </p>
        </Show>
        <div class={styles.row}>
          <button type="button" class={styles.button} onClick={props.onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            class={`${styles.button} ${styles.primary}`}
            disabled={!valid() || busy()}
          >
            {busy() ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
        <p class={styles.help}>
          El PIN se genera al guardar y se muestra una sola vez.
        </p>
      </form>
    </BottomSheet>
  );
}
