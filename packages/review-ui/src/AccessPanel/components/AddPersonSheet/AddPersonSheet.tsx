import { MAX_NAME_LENGTH, MAX_ROLE_LENGTH } from '@colaboradocs/review-core';
import { Show } from 'solid-js';
import BottomSheet from '../../../BottomSheet/BottomSheet';
import Button from '../../../Button/Button';
import CloseIcon from '../../../icons/CloseIcon';
import UserPlusIcon from '../../../icons/UserPlusIcon';
// '../../../icons/CloseIcon';
import type { SheetLayerProps } from '../../../overlay/overlay.types';
import { useAddPersonSheet } from './AddPersonSheet.hooks';
import styles from './AddPersonSheet.module.css';

export default function AddPersonSheet(props: SheetLayerProps) {
  const sheet = useAddPersonSheet(() => props.close());

  return (
    <BottomSheet
      open={props.open}
      kicker="Accesos"
      title="Agregar persona"
      compact
      onClose={props.onClose}
    >
      <form class={styles.form} onSubmit={sheet.submit}>
        <label class={styles.label}>
          Nombre
          <input
            class={styles.field}
            required
            maxLength={MAX_NAME_LENGTH}
            autocomplete="off"
            value={sheet.name()}
            onInput={(event) => sheet.updateName(event.currentTarget.value)}
          />
        </label>
        <label class={styles.label}>
          {sheet.roleLabel()}
          <input
            class={styles.field}
            required
            maxLength={MAX_ROLE_LENGTH}
            autocomplete="off"
            value={sheet.role()}
            onInput={(event) => sheet.updateRole(event.currentTarget.value)}
          />
        </label>
        <label class={styles.switch}>
          <input
            type="checkbox"
            checked={sheet.isAdmin()}
            onChange={(event) =>
              sheet.updateIsAdmin(event.currentTarget.checked)
            }
          />
          Administrador
          <span class={styles.help}>
            Puede agregar y quitar personas, salvo a quien le dio acceso.
          </span>
        </label>
        <Show when={sheet.error()}>
          <p class={styles.error} role="alert">
            {sheet.error()}
          </p>
        </Show>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={props.onClose}>
            Cancelar
          </Button>
          <Button
            icon={UserPlusIcon}
            variant="primary"
            submit
            disabled={!sheet.valid() || sheet.busy()}
          >
            {sheet.busy() ? 'Agregando…' : 'Agregar'}
          </Button>
        </div>
        <p class={styles.note}>
          El PIN se genera al guardar y se muestra una sola vez.
        </p>
      </form>
    </BottomSheet>
  );
}
