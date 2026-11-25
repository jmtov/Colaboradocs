import { filterPeople, type ReviewerLabel } from '@colaboradocs/review-core';
import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createMemo, createSignal, For, Show } from 'solid-js';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import styles from './PeopleSheet.module.css';
import type { PeopleSheetProps } from './PeopleSheet.types';

/** Elegir a una o varias personas del espacio: los participantes de un acta o el responsable de una iniciativa. */
export default function PeopleSheet(props: PeopleSheetProps) {
  const mentioned = () => props.mentioned ?? [];
  const already = props.current
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  // Quien ya estaba escrito y no está registrado (o se escribió a mano) se conserva y se puede quitar.
  const everyone = createMemo<ReviewerLabel[]>(() => [
    ...already
      .filter((name) => !props.people.some((person) => person.name === name))
      .map((name) => ({ name, municipality: null })),
    ...props.people,
  ]);
  const isMentioned = (name: string) => mentioned().includes(name);
  // Sin participantes todavía, parten elegidas las personas de las que habla el documento.
  const [chosen, setChosen] = createSignal<ReadonlySet<string>>(
    new Set(
      already.length > 0
        ? already
        : mentioned().filter((name) =>
            props.people.some((person) => person.name === name),
          ),
    ),
  );
  const [query, setQuery] = createSignal('');
  const shown = createMemo(() =>
    filterPeople(everyone(), query(), everyone().length),
  );

  function toggle(name: string) {
    setChosen((current) => {
      const next = new Set(props.single ? [] : current);
      if (props.single && current.has(name)) return next;
      if (!next.delete(name)) next.add(name);
      return next;
    });
  }

  function apply() {
    props.close(
      everyone()
        .filter((person) => chosen().has(person.name))
        .map((person) => person.name)
        .join(', '),
    );
  }

  return (
    <BottomSheet
      open={props.open}
      kicker={props.kicker}
      title={props.title}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <p class={styles.hint}>
          {props.hint}{' '}
          <Show when={!props.single}>
            {chosen().size} {chosen().size === 1 ? 'elegida' : 'elegidas'}.
          </Show>
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
                  aria-pressed={chosen().has(person.name)}
                  onClick={() => toggle(person.name)}
                >
                  <span class={styles.name}>{person.name}</span>
                  <Show when={person.municipality}>
                    <span class={styles.municipality}>
                      {person.municipality}
                    </span>
                  </Show>
                  <Show when={isMentioned(person.name)}>
                    <span class={styles.municipality}>· en el documento</span>
                  </Show>
                </button>
              </li>
            )}
          </For>
        </ul>
        <div class={styles.row}>
          <span class={styles.gap} />
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button icon={CheckIcon} variant="primary" onClick={apply}>
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
