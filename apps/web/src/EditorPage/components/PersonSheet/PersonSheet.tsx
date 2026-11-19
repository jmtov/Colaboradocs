import { filterPeople, type ReviewerLabel } from '@colaboradocs/review-core';
import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import AtSignIcon from '@/icons/AtSignIcon';
import CloseIcon from '@/icons/CloseIcon';
import styles from './PersonSheet.module.css';
import type { PersonSheetProps } from './PersonSheet.types';

/** Elegir a una persona del espacio para mencionarla: su nombre en el texto abre su tarjeta. */
export default function PersonSheet(props: PersonSheetProps) {
  const [query, setQuery] = createSignal('');
  const [chosen, setChosen] = createSignal<ReviewerLabel | null>(null);
  const [text, setText] = createSignal('');
  const shown = createMemo(() =>
    filterPeople(props.people, query(), props.people.length),
  );

  function choose(person: ReviewerLabel) {
    setChosen(person);
    setText(person.name);
  }

  function insert() {
    const person = chosen();
    if (!person || !text().trim()) return;
    props.close({ name: person.name, text: text().trim() });
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Texto"
      title="Mencionar a una persona"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <p class={styles.hint}>
          La persona queda escrita en el texto y, al tocarla, se abre su tarjeta
          con el municipio.
        </p>
        <input
          class={`${fieldStyles.input} ${styles.search}`}
          type="search"
          value={query()}
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
        <ul class={styles.list}>
          <For
            each={shown()}
            fallback={<li class={styles.empty}>Nadie coincide.</li>}
          >
            {(person) => (
              <li>
                <button
                  type="button"
                  class={styles.option}
                  aria-pressed={chosen()?.name === person.name}
                  onClick={() => choose(person)}
                >
                  <span class={styles.name}>{person.name}</span>
                  <Show when={person.municipality}>
                    <span class={styles.municipality}>
                      {person.municipality}
                    </span>
                  </Show>
                </button>
              </li>
            )}
          </For>
        </ul>
        <Show when={chosen()}>
          <FieldGroup
            title="En el texto"
            hint="Puedes acortarlo («Norberto Giraldo»): seguirá abriendo la tarjeta de esta persona."
          >
            <FieldRow label="Se escribe">
              <input
                class={fieldStyles.input}
                value={text()}
                maxLength={100}
                onInput={(event) => setText(event.currentTarget.value)}
              />
            </FieldRow>
          </FieldGroup>
        </Show>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={AtSignIcon}
            variant="primary"
            disabled={!chosen() || !text().trim()}
            onClick={insert}
          >
            Insertar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
