import type { ManagedReviewer } from '@colaboradocs/review-core';
import BottomSheet from '../../../../../BottomSheet/BottomSheet';
import Button from '../../../../../Button/Button';
import CheckIcon from '../../../../../icons/CheckIcon';
import CloseIcon from '../../../../../icons/CloseIcon';
import type { SheetLayerProps } from '../../../../../overlay/overlay.types';
import { ROLE_EDIT_MAX_LENGTH } from '../../PersonRow.constants';
import { useEditPersonSheet } from './EditPersonSheet.hooks';
import styles from './EditPersonSheet.module.css';

type Props = SheetLayerProps & { person: ManagedReviewer };

/** Edita a una persona: hoy, su rol (p. ej., el municipio). */
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
          <Button icon={CloseIcon} onClick={props.onClose}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            submit
            disabled={!sheet.canSave()}
          >
            Guardar
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
