import { defaultValue, type Field } from '@colaboradocs/deck-core';
import { Button } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import type { Path } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import CloseIcon from '@/shared/icons/CloseIcon';
import PlusIcon from '@/shared/icons/PlusIcon';
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
        <Button
          icon={CloseIcon}
          size="sm"
          onClick={() => deckStore.remove(props.path)}
        >
          Quitar
        </Button>
      </Show>
    ) : (
      <Button
        icon={PlusIcon}
        size="sm"
        onClick={() =>
          deckStore.set(props.path, defaultValue(props.field.fields))
        }
      >
        Agregar
      </Button>
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
