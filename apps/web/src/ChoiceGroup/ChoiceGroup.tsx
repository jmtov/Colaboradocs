import { For, Show } from 'solid-js';
import styles from './ChoiceGroup.module.css';

export type Choice = { value: string; label: string; count?: number };

type Props = {
  /** El nombre del grupo: se ve encima y lo lee el lector de pantalla. */
  label: string;
  options: Choice[];
  /** La opción elegida; `null`, «todas». */
  selected: string | null;
  onChange: (selected: string | null) => void;
  /** El nombre de la primera opción, que quita la elección («Todos»). */
  allLabel: string;
  /** Cuántos hay en total, junto a «Todos». */
  allCount?: number;
};

/** Un grupo de opciones para una hoja de filtros, donde se elige una: botones con borde colapsado, como el selector de tema. */
export default function ChoiceGroup(props: Props) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset arrastra estilos de formulario que no queremos
    <div class={styles.group} role="group" aria-label={props.label}>
      <span class={styles.label}>{props.label}</span>
      <div class={styles.options}>
        <button
          type="button"
          class={styles.option}
          classList={{ [styles.on]: props.selected === null }}
          aria-pressed={props.selected === null}
          onClick={() => props.onChange(null)}
        >
          {props.allLabel}
          <Show when={props.allCount !== undefined}>
            <span class={styles.count}>{props.allCount}</span>
          </Show>
        </button>
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              class={styles.option}
              classList={{ [styles.on]: props.selected === option.value }}
              aria-pressed={props.selected === option.value}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
              <Show when={option.count !== undefined}>
                <span class={styles.count}>{option.count}</span>
              </Show>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
