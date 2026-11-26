import { type DocumentKind, KIND_GROUPS } from '@colaboradocs/review-core';
import { For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import { DATE_HINTS } from './EditorDetails.constants';
import styles from './EditorDetails.module.css';
import type { EditorDetailsProps } from './EditorDetails.types';

/**
 * Los datos del documento, a la vista antes del contenido (se editan en el sitio, sin hoja ni
 * menú), en dos grupos: lo que dice el documento y cómo se clasifica.
 */
export default function EditorDetails(props: EditorDetailsProps) {
  const set = <K extends keyof EditorDetailsProps['details']>(
    key: K,
    value: EditorDetailsProps['details'][K],
  ) => props.onChange({ ...props.details, [key]: value });

  return (
    <div class={styles.details}>
      <FieldGroup hint="La descripción aparece en la tarjeta del inicio. Cambiar el título no cambia la dirección.">
        <FieldRow label="Título">
          <input
            class={fieldStyles.input}
            value={props.details.title}
            maxLength={200}
            onInput={(event) => set('title', event.currentTarget.value)}
          />
        </FieldRow>
        <FieldRow label="Descripción" stacked>
          <textarea
            class={`${fieldStyles.input} ${styles.description}`}
            rows={1}
            maxLength={400}
            placeholder="—"
            value={props.details.description}
            onInput={(event) => set('description', event.currentTarget.value)}
          />
        </FieldRow>
      </FieldGroup>
      <FieldGroup hint={DATE_HINTS[props.details.type]}>
        <FieldRow label="Tipo">
          <select
            class={fieldStyles.input}
            value={props.details.type}
            onChange={(event) =>
              set('type', event.currentTarget.value as DocumentKind)
            }
          >
            <For each={KIND_GROUPS}>
              {(group) => (
                <option value={group.kind}>
                  {group.kind === 'other' ? 'Otro' : group.singular}
                </option>
              )}
            </For>
          </select>
        </FieldRow>
        <FieldRow label="Fecha">
          <input
            class={fieldStyles.input}
            type="date"
            value={props.details.date}
            onInput={(event) => set('date', event.currentTarget.value)}
          />
        </FieldRow>
        <Show when={props.details.type === 'initiative'}>
          <FieldRow label="Responsable">
            <button
              type="button"
              data-flat
              class={`${fieldStyles.input} ${styles.pick}`}
              onClick={() => props.onPickPeople('owner')}
            >
              {props.details.owner || 'Elegir…'}
            </button>
          </FieldRow>
        </Show>
        <Show when={props.details.type === 'minutes'}>
          <FieldRow label="Participantes">
            <button
              type="button"
              data-flat
              class={`${fieldStyles.input} ${styles.pick}`}
              onClick={() => props.onPickPeople('attendees')}
            >
              {props.details.attendees || 'Elegir…'}
            </button>
          </FieldRow>
        </Show>
      </FieldGroup>
    </div>
  );
}
