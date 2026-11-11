import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createSignal, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import TrashIcon from '@/icons/TrashIcon';
import styles from './TermSheet.module.css';
import type { TermSheetProps } from './TermSheet.types';

/** Un término del glosario: su texto, su definición y cómo se enlaza en el documento. */
export default function TermSheet(props: TermSheetProps) {
  const [term, setTerm] = createSignal(props.term);
  const [definition, setDefinition] = createSignal(props.definition);
  const [forms, setForms] = createSignal(props.forms);
  const valid = () => term().trim() !== '' && definition().trim() !== '';

  return (
    <BottomSheet
      open={props.open}
      kicker="Glosario"
      title={props.isNew ? 'Agregar un término' : props.term}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup
          title="Término"
          hint="«Aparece como» es cómo se escribe en el texto, en minúsculas y separado por comas (p. ej. veeduría, veedurías): esas palabras se enlazan solas a la definición. Vacío, no se enlaza."
        >
          <FieldRow label="Término">
            <input
              class={fieldStyles.input}
              value={term()}
              maxLength={120}
              onInput={(event) => setTerm(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Definición">
            <textarea
              class={`${fieldStyles.input} ${styles.definition}`}
              rows={1}
              value={definition()}
              onInput={(event) => setDefinition(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Aparece como">
            <input
              class={fieldStyles.input}
              value={forms()}
              placeholder="—"
              onInput={(event) => setForms(event.currentTarget.value)}
            />
          </FieldRow>
        </FieldGroup>

        <div class={styles.row}>
          <Show when={!props.isNew}>
            <Button
              icon={TrashIcon}
              variant="danger"
              onClick={() => props.close({ remove: true })}
            >
              Quitar término
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
              props.close({
                term: term().trim(),
                definition: definition().trim(),
                forms: forms(),
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
