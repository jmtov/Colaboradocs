import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createSignal, For } from 'solid-js';
import type { DocumentSection } from '@/content/content.types';
import { sectionKicker } from '@/content/content.utils';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import TrashIcon from '@/icons/TrashIcon';
import styles from './SectionSheet.module.css';
import type { SectionSheetProps } from './SectionSheet.types';

const STATUSES: { value: DocumentSection['status']; label: string }[] = [
  { value: 'listo', label: 'Listo' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
];

/** Lo de una sección que no es texto: estado, descripción de la tarjeta y si es anexo. */
export default function SectionSheet(props: SectionSheetProps) {
  const [status, setStatus] = createSignal(props.section.status);
  const [description, setDescription] = createSignal(
    props.section.description ?? '',
  );
  const [annex, setAnnex] = createSignal(!/^\d+$/.test(props.section.num));

  return (
    <BottomSheet
      open={props.open}
      kicker={sectionKicker(props.section)}
      title={props.section.title || 'Sin título'}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup
          title="Ajustes"
          hint="La descripción es la línea que sale en la tarjeta de la sección. El número sale de la posición."
        >
          <FieldRow label="Estado">
            <select
              class={fieldStyles.input}
              value={status()}
              onChange={(event) =>
                setStatus(
                  event.currentTarget.value as DocumentSection['status'],
                )
              }
            >
              <For each={STATUSES}>
                {(item) => <option value={item.value}>{item.label}</option>}
              </For>
            </select>
          </FieldRow>
          <FieldRow label="Descripción">
            <input
              class={fieldStyles.input}
              value={description()}
              maxLength={300}
              placeholder="—"
              onInput={(event) => setDescription(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Anexo">
            <input
              type="checkbox"
              class={styles.check}
              checked={annex()}
              onChange={(event) => setAnnex(event.currentTarget.checked)}
            />
          </FieldRow>
        </FieldGroup>

        <div class={styles.row}>
          <Button
            icon={TrashIcon}
            variant="danger"
            disabled={!props.canRemove}
            onClick={() => props.close({ remove: true })}
          >
            Eliminar sección
          </Button>
          <span class={styles.gap} />
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            onClick={() =>
              props.close({
                attrs: {
                  status: status(),
                  description: description().trim() || null,
                  annex: annex(),
                },
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
