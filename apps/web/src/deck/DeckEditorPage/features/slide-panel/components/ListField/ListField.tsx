import { defaultValue, type Field } from '@colaboradocs/deck-core';
import { Button } from '@colaboradocs/review-ui';
import { For } from 'solid-js';
import { cloneJson } from '@/deck/DeckEditorPage/features/deck/clone.utils';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import type { Path } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import PlusIcon from '@/shared/icons/PlusIcon';
import FieldForm from '../FieldForm/FieldForm';
import FieldSection from '../FieldSection/FieldSection';
import ItemCard from '../ItemCard/ItemCard';
import styles from './ListField.module.css';

interface ListFieldProps {
  field: Extract<Field, { type: 'list' }>;
  value: Record<string, unknown>[] | undefined;
  path: Path;
}

/** Una lista de ítems del mismo type: se agregan, se reordenan y se quitan. */
export default function ListField(props: ListFieldProps) {
  const items = () => props.value ?? [];
  const add = () => {
    const first = props.field.sample[0] ?? defaultValue(props.field.fields);
    if (props.value)
      deckStore.insert(props.path, items().length, cloneJson(first));
    else deckStore.set(props.path, [cloneJson(first)]);
  };
  const canRemove = () => !props.field.required || items().length > 1;
  return (
    <FieldSection
      title={props.field.label}
      actions={
        <Button icon={PlusIcon} size="sm" onClick={add}>
          {props.field.itemLabel}
        </Button>
      }
    >
      <div class={styles.items}>
        <For each={items()}>
          {(item, i) => (
            <ItemCard
              name={`${props.field.itemLabel} ${i() + 1}`}
              index={i()}
              count={items().length}
              canRemove={canRemove()}
              onMove={(to) => deckStore.move(props.path, i(), to)}
              onRemove={() => deckStore.remove([...props.path, i()])}
            >
              <FieldForm
                fields={props.field.fields}
                value={item}
                path={[...props.path, i()]}
              />
            </ItemCard>
          )}
        </For>
      </div>
    </FieldSection>
  );
}
