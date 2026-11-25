import type { Field } from '@colaboradocs/deck-core';
import { ICONS } from '@colaboradocs/deck-render';
import { For, Match, Switch } from 'solid-js';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import type { Path } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import { toDisplayValue, toStoredValue } from '../FieldForm/FieldForm.utils';
import styles from './FieldInput.module.css';

interface FieldInputProps {
  field: Field;
  value: unknown;
  path: Path;
}

const selectClass = `${styles.input} ${styles.select}`;
const textareaClass = `${styles.input} ${styles.textarea}`;

/** El control de un campo que guarda un solo valor (texto, número, opción, casilla…). */
export default function FieldInput(props: FieldInputProps) {
  const checked = () =>
    props.field.type === 'boolean'
      ? (props.value ?? props.field.default ?? false) === true
      : false;
  const save = (raw: string | boolean) => {
    const stored = toStoredValue(props.field, raw);
    // Escribir seguido en el mismo campo cuenta como un solo paso para deshacer.
    if (stored === undefined) deckStore.remove(props.path);
    else deckStore.set(props.path, stored, props.path.join('.'));
  };
  const display = () => toDisplayValue(props.field, props.value);
  const blank = () => !props.field.required;
  const options = () =>
    props.field.type === 'select' ? props.field.options : [];
  return (
    <Switch>
      <Match
        when={props.field.type === 'longtext' || props.field.type === 'lines'}
      >
        <textarea
          class={textareaClass}
          rows={props.field.type === 'lines' ? 2 : 3}
          value={display()}
          onInput={(e) => save(e.currentTarget.value)}
        />
      </Match>
      <Match when={props.field.type === 'number'}>
        <input
          class={styles.input}
          type="number"
          step="any"
          min={props.field.type === 'number' ? props.field.min : undefined}
          value={display()}
          onInput={(e) => save(e.currentTarget.value)}
        />
      </Match>
      <Match when={props.field.type === 'boolean'}>
        <input
          class={styles.switch}
          type="checkbox"
          role="switch"
          aria-checked={checked()}
          checked={checked()}
          onChange={(e) => save(e.currentTarget.checked)}
        />
      </Match>
      <Match when={props.field.type === 'select'}>
        <select
          class={selectClass}
          value={display()}
          onChange={(e) => save(e.currentTarget.value)}
        >
          {blank() && <option value="">—</option>}
          <For each={options()}>
            {(o) => <option value={o.value}>{o.label}</option>}
          </For>
        </select>
      </Match>
      <Match when={props.field.type === 'icon'}>
        <select
          class={selectClass}
          value={display()}
          onChange={(e) => save(e.currentTarget.value)}
        >
          <option value="">Sin icono</option>
          <For each={Object.keys(ICONS)}>
            {(name) => <option value={name}>{name}</option>}
          </For>
        </select>
      </Match>
      <Match when={props.field.type === 'category'}>
        <select
          class={selectClass}
          value={display()}
          onChange={(e) => save(e.currentTarget.value)}
        >
          <option value="">Ninguna</option>
          <For
            each={Array.from(
              { length: deckStore.categoryCount() },
              (_, i) => i,
            )}
          >
            {(i) => <option value={i}>{i + 1}</option>}
          </For>
        </select>
      </Match>
      <Match when={true}>
        <input
          class={styles.input}
          type="text"
          value={display()}
          placeholder={
            props.field.type === 'datetime'
              ? '2026-11-22T10:00:00-05:00'
              : undefined
          }
          onInput={(e) => save(e.currentTarget.value)}
        />
      </Match>
    </Switch>
  );
}
