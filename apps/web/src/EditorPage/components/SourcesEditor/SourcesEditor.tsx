import { Index, Show } from 'solid-js';
import type { DocumentSource } from '@/content/content.types';
import styles from './SourcesEditor.module.css';

type Props = {
  sources: DocumentSource[];
  onChange: (index: number, field: keyof DocumentSource, value: string) => void;
  onAdd: () => void;
  /** Quita la última fuente (las citas son por número: quitar otra las desfasaría). */
  onRemoveLast: () => void;
};

/** La bibliografía del documento: las fuentes a las que remiten las citas «[n]». */
export default function SourcesEditor(props: Props) {
  return (
    <section id="bibliografia" class={styles.section}>
      <h2 class={styles.title}>Bibliografía</h2>
      <p class={styles.hint}>
        Las fuentes del pie del documento. Una cita «[2]» en el texto remite a
        la segunda de esta lista, así que el orden importa: por ahora se agregan
        al final y solo se puede quitar la última.
      </p>
      <ol class={styles.list}>
        {/* Index: la fila sigue siendo la misma mientras se escribe en ella. */}
        <Index each={props.sources}>
          {(source, index) => (
            <li class={styles.item}>
              <span class={styles.number}>[{index + 1}]</span>
              <div class={styles.fields}>
                <input
                  class={styles.input}
                  aria-label={`Fuente ${index + 1}: referencia`}
                  value={source().label}
                  maxLength={300}
                  placeholder="Autor, título, año"
                  onInput={(event) =>
                    props.onChange(index, 'label', event.currentTarget.value)
                  }
                />
                <input
                  class={styles.input}
                  aria-label={`Fuente ${index + 1}: enlace`}
                  value={source().url}
                  placeholder="https://… (opcional)"
                  onInput={(event) =>
                    props.onChange(index, 'url', event.currentTarget.value)
                  }
                />
              </div>
            </li>
          )}
        </Index>
      </ol>
      <div class={styles.actions}>
        <button type="button" class={styles.button} onClick={props.onAdd}>
          + Agregar fuente
        </button>
        <Show when={props.sources.length > 0}>
          <button
            type="button"
            class={styles.button}
            onClick={props.onRemoveLast}
          >
            Quitar la última
          </button>
        </Show>
      </div>
    </section>
  );
}
