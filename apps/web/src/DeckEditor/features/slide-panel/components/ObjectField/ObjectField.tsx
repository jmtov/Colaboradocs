import { defaultValue, type Field } from '@colaboradocs/deck-core';
import { Show } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import type { Path } from '@/DeckEditor/features/deck/deck.utils';
import FieldForm from '../FieldForm/FieldForm';
import FieldSection from '../FieldSection/FieldSection';

interface ObjectFieldProps {
  field: Extract<Field, { type: 'object' }>;
  value: Record<string, unknown> | undefined;
  path: Path;
}

/** Un grupo de campos con título (la línea superior, una persona). Si es opcional se agrega y se quita. */
export default function ObjectField(props: ObjectFieldProps) {
  const action = () =>
    props.value ? (
      <Show when={!props.field.required}>
        <button
          type="button"
          class="btn"
          onClick={() => deckStore.remove(props.path)}
        >
          Quitar
        </button>
      </Show>
    ) : (
      <button
        type="button"
        class="btn"
        onClick={() =>
          deckStore.set(props.path, defaultValue(props.field.fields))
        }
      >
        Agregar
      </button>
    );
  return (
    <FieldSection title={props.field.label} actions={action()}>
      <Show when={props.value}>
        {(value) => (
          <FieldForm
            fields={props.field.fields}
            value={value()}
            path={props.path}
          />
        )}
      </Show>
    </FieldSection>
  );
}
