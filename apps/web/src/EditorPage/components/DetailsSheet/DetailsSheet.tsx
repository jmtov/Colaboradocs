import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import styles from './DetailsSheet.module.css';
import type { DetailsSheetProps } from './DetailsSheet.types';

/** El título del documento y la descripción de su tarjeta en la home. */
export default function DetailsSheet(props: DetailsSheetProps) {
  const [title, setTitle] = createSignal(props.title);
  const [description, setDescription] = createSignal(props.description);

  return (
    <BottomSheet
      open={props.open}
      kicker="Documento"
      title="Editar título y descripción"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup
          title="Documento"
          hint="El título es el del encabezado. La descripción es la línea de la tarjeta en la home; vacía, la tarjeta no lleva descripción. La dirección (/d/…) no cambia."
        >
          <FieldRow label="Título">
            <input
              class={fieldStyles.input}
              value={title()}
              maxLength={200}
              onInput={(event) => setTitle(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Descripción">
            <textarea
              class={`${fieldStyles.input} ${styles.description}`}
              rows={1}
              maxLength={400}
              placeholder="—"
              value={description()}
              onInput={(event) => setDescription(event.currentTarget.value)}
            />
          </FieldRow>
        </FieldGroup>

        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            disabled={title().trim() === ''}
            onClick={() =>
              props.close({
                title: title().trim(),
                description: description().trim(),
              })
            }
          >
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
