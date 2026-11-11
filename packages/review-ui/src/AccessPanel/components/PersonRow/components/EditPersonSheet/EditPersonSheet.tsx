import type { ManagedReviewer } from '@juntanza/review-core';
import BottomSheet from '../../../../../BottomSheet/BottomSheet';
import type { SheetLayerProps } from '../../../../../overlay/overlay.types';
import { ROLE_EDIT_MAX_LENGTH } from '../../PersonRow.constants';
import { useEditPersonSheet } from './EditPersonSheet.hooks';
import styles from './EditPersonSheet.module.css';

type Props = SheetLayerProps & { person: ManagedReviewer };

/** Edita a una persona: hoy, su rol (en la Juntanza, el municipio). */
export default function EditPersonSheet(props: Props) {
  const sheet = useEditPersonSheet({
    person: () => props.person,
    close: () => props.close(),
  });

  return (
    <BottomSheet
      open={props.open}
      kicker="Accesos"
      title={`Editar a ${props.person.name}`}
      compact
      onClose={props.onClose}
    >
      <form
        class={styles.content}
        onSubmit={(event) => {
          event.preventDefault();
          sheet.save();
        }}
      >
        <label class={styles.label}>
          {sheet.roleLabel()}
          <input
            class={styles.field}
            value={sheet.draft()}
            maxLength={ROLE_EDIT_MAX_LENGTH}
            onInput={(event) => sheet.updateDraft(event.currentTarget.value)}
          />
        </label>
        <div class={styles.row}>
          <button type="button" class={styles.button} onClick={props.onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            class={`${styles.button} ${styles.primary}`}
            disabled={!sheet.canSave()}
          >
            Guardar
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
