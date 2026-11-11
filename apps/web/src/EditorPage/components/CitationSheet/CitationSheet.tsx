import { BottomSheet } from '@colaboradocs/review-ui';
import { createSignal, For, Show } from 'solid-js';
import styles from './CitationSheet.module.css';
import type { CitationSheetProps } from './CitationSheet.types';

/** Elegir de la bibliografía a qué fuentes remite una cita («[2, 3]»). */
export default function CitationSheet(props: CitationSheetProps) {
  const [chosen, setChosen] = createSignal<number[]>([]);

  function toggle(number: number, on: boolean) {
    setChosen((current) =>
      on ? [...current, number] : current.filter((item) => item !== number),
    );
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Bibliografía"
      title="Insertar una cita"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <Show
          when={props.sources.length > 0}
          fallback={
            <p class={styles.text}>
              Todavía no hay fuentes. Agrégalas en la bibliografía, al final del
              documento, y vuelve a intentarlo.
            </p>
          }
        >
          <p class={styles.text}>
            Elige una o varias fuentes: la cita queda como «[2, 3]» donde está
            el cursor.
          </p>
          <ul class={styles.list}>
            <For each={props.sources}>
              {(source, index) => (
                <li>
                  <label class={styles.item}>
                    <input
                      type="checkbox"
                      class={styles.check}
                      onChange={(event) =>
                        toggle(index() + 1, event.currentTarget.checked)
                      }
                    />
                    <span class={styles.number}>[{index() + 1}]</span>
                    <span>{source.label || 'Sin referencia'}</span>
                  </label>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <div class={styles.row}>
          <button
            type="button"
            class={styles.button}
            onClick={() => props.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            disabled={chosen().length === 0}
            onClick={() => props.close([...chosen()].sort((a, b) => a - b))}
          >
            Insertar
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
