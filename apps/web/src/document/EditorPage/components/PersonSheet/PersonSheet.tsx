import { filterPeople, type ReviewerLabel } from '@colaboradocs/review-core';
import { BottomSheet, Button } from '@colaboradocs/review-ui';
import AtSignIcon from 'lucide-solid/icons/at-sign';
import CheckIcon from 'lucide-solid/icons/check';
import TrashIcon from 'lucide-solid/icons/trash';
import CloseIcon from 'lucide-solid/icons/x';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import styles from './PersonSheet.module.css';
import type { PersonSheetProps } from './PersonSheet.types';

/**
 * Elegir a una persona del espacio para mencionarla (su nombre en el texto abre su
 * tarjeta) o, con `current`, cambiar a quién apunta una mención que ya está o quitarla.
 */
export default function PersonSheet(props: PersonSheetProps) {
  const editing = () => props.current !== undefined;
  // Quien se menciona puede ya no estar registrado: igual se muestra, para poder cambiarla.
  const everyone = createMemo(() => {
    const current = props.current;
    if (current === undefined || props.people.some((p) => p.name === current)) {
      return props.people;
    }
    return [{ name: current, municipality: null }, ...props.people];
  });
  const [query, setQuery] = createSignal('');
  const [chosen, setChosen] = createSignal<ReviewerLabel | null>(
    everyone().find((person) => person.name === props.current) ?? null,
  );
  const [text, setText] = createSignal('');
  const shown = createMemo(() =>
    filterPeople(everyone(), query(), everyone().length),
  );
  const canApply = () => chosen() !== null && (editing() || text().trim());

  function choose(person: ReviewerLabel) {
    setChosen(person);
    setText(person.name);
  }

  function apply() {
    const person = chosen();
    if (!person || !canApply()) return;
    props.close({ name: person.name, text: text().trim() });
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Texto"
      title={editing() ? 'Editar la mención' : 'Mencionar a una persona'}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <p class={styles.hint}>
          <Show
            when={editing()}
            fallback="La persona queda escrita en el texto y, al tocarla, se abre su tarjeta con el municipio."
          >
            Elige a quién apunta este nombre, o quita la mención: el texto se
            queda como está.
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
        <Show when={chosen() && !editing()}>
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
          <Show when={editing()}>
            <Button
              icon={TrashIcon}
              variant="danger"
              onClick={() => props.close({ remove: true })}
            >
              Quitar mención
            </Button>
          </Show>
          <span class={styles.gap} />
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={editing() ? CheckIcon : AtSignIcon}
            variant="primary"
            disabled={!canApply()}
            onClick={apply}
          >
            <Show when={editing()} fallback="Insertar">
              Aplicar
            </Show>
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
