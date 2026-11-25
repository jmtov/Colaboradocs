import { type DocumentKind, KIND_GROUPS } from '@colaboradocs/review-core';
import { For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import styles from './EditorDetails.module.css';
import type { EditorDetailsProps } from './EditorDetails.types';

/** Título, descripción y tipo del documento, a la vista antes del contenido: se editan en el sitio, sin hoja ni menú. */
export default function EditorDetails(props: EditorDetailsProps) {
  const set = <K extends keyof EditorDetailsProps['details']>(
    key: K,
    value: EditorDetailsProps['details'][K],
  ) => props.onChange({ ...props.details, [key]: value });

  return (
    <FieldGroup
      title="Documento"
      hint="El título es el del encabezado. La descripción es la línea de la tarjeta en la home; vacía, la tarjeta no lleva descripción. El tipo y la fecha salen sobre el título en la home; la fecha es la de elaboración (en un acta, el día de la reunión) y ordena los documentos; vacía, vale la de la última versión. La dirección (/d/…) no cambia."
    >
      <FieldRow label="Título">
        <input
          class={fieldStyles.input}
          value={props.details.title}
          maxLength={200}
          onInput={(event) => set('title', event.currentTarget.value)}
        />
      </FieldRow>
      <FieldRow label="Descripción">
        <textarea
          class={`${fieldStyles.input} ${styles.description}`}
          rows={1}
          maxLength={400}
          placeholder="—"
          value={props.details.description}
          onInput={(event) => set('description', event.currentTarget.value)}
        />
      </FieldRow>
      <FieldRow label="Tipo">
        <select
          class={fieldStyles.input}
          value={props.details.tipo}
          onChange={(event) =>
            set('tipo', event.currentTarget.value as DocumentKind)
          }
        >
          <For each={KIND_GROUPS}>
            {(group) => <option value={group.kind}>{group.title}</option>}
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
      <Show when={props.details.tipo === 'iniciativa'}>
        <FieldRow label="Responsable">
          <button
            type="button"
            data-flat
            class={`${fieldStyles.input} ${styles.pick}`}
            onClick={() => props.onPickPeople('responsable')}
          >
            {props.details.responsable || 'Elegir…'}
          </button>
        </FieldRow>
      </Show>
      <Show when={props.details.tipo === 'acta'}>
        <FieldRow label="Participantes">
          <button
            type="button"
            data-flat
            class={`${fieldStyles.input} ${styles.pick}`}
            onClick={() => props.onPickPeople('participantes')}
          >
            {props.details.participantes || 'Elegir…'}
          </button>
        </FieldRow>
      </Show>
    </FieldGroup>
  );
}
