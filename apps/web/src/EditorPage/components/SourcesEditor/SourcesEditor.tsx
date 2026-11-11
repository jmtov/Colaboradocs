import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import type { DocumentSource } from '@/content/content.types';
import PencilIcon from '@/icons/PencilIcon';
import PlusIcon from '@/icons/PlusIcon';
import styles from './SourcesEditor.module.css';

type Props = {
  sources: DocumentSource[];
  /** Editar la fuente de esa posición. */
  onEdit: (index: number) => void;
  onAdd: () => void;
};

/** La bibliografía del documento: las fuentes a las que remiten las citas «[n]», una a la vez en su hoja. */
export default function SourcesEditor(props: Props) {
  return (
    <section id="bibliografia" class={styles.section}>
      <h2 class={styles.title}>Bibliografía</h2>
      <p class={styles.hint}>
        Las fuentes del pie del documento. Una cita «[2]» en el texto remite a
        la segunda de esta lista, así que el orden importa: por ahora se agregan
        al final y solo se puede quitar la última.
      </p>
      <Show when={props.sources.length > 0}>
        <ol class={styles.list}>
          <For each={props.sources}>
            {(source, index) => (
              <li class={styles.item}>
                <span class={styles.number}>[{index() + 1}]</span>
                <div class={styles.text}>
                  <span class={styles.label}>{source.label}</span>
                  <Show when={source.url}>
                    <span class={styles.url}>{source.url}</span>
                  </Show>
                </div>
                <Button
                  icon={PencilIcon}
                  aria-label={`Editar fuente ${index() + 1}`}
                  onClick={() => props.onEdit(index())}
                >
                  Editar
                </Button>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Button icon={PlusIcon} class={styles.add} onClick={props.onAdd}>
        Agregar fuente
      </Button>
    </section>
  );
}
