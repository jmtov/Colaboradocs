import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createSignal, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import TrashIcon from '@/icons/TrashIcon';
import styles from './SourceSheet.module.css';
import type { SourceSheetProps } from './SourceSheet.types';

/** Una fuente de la bibliografía: su referencia y, si la hay, su dirección. */
export default function SourceSheet(props: SourceSheetProps) {
  const [label, setLabel] = createSignal(props.label);
  const [url, setUrl] = createSignal(props.url);
  const valid = () => label().trim() !== '';

  return (
    <BottomSheet
      open={props.open}
      kicker="Bibliografía"
      title={props.isNew ? 'Agregar una fuente' : `Fuente [${props.number}]`}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup
          title="Fuente"
          hint="La referencia es lo que se lee en el pie del documento. El enlace es opcional."
        >
          <FieldRow label="Referencia">
            <textarea
              class={`${fieldStyles.input} ${styles.label}`}
              rows={1}
              maxLength={300}
              placeholder="Autor, título, año"
              value={label()}
              onInput={(event) => setLabel(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Enlace">
            <input
              class={fieldStyles.input}
              value={url()}
              placeholder="https://… (opcional)"
              onInput={(event) => setUrl(event.currentTarget.value)}
            />
          </FieldRow>
        </FieldGroup>

        <div class={styles.row}>
          <Show when={!props.isNew && props.canRemove}>
            <Button
              icon={TrashIcon}
              variant="danger"
              onClick={() => props.close({ remove: true })}
            >
              Quitar fuente
            </Button>
          </Show>
          <span class={styles.gap} />
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            disabled={!valid()}
            onClick={() =>
              props.close({ label: label().trim(), url: url().trim() })
            }
          >
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
