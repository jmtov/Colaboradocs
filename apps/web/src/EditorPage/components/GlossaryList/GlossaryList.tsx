import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import PencilIcon from '@/icons/PencilIcon';
import PlusIcon from '@/icons/PlusIcon';
import {
  formsOf,
  type GlossaryEntry,
  type GlossaryLinks,
} from '../../glossary.utils';
import styles from './GlossaryList.module.css';

type Props = {
  entries: GlossaryEntry[];
  links: GlossaryLinks;
  /** Editar el término de esa posición. */
  onEdit: (index: number) => void;
  onAdd: () => void;
};

/** El glosario del documento, fuera del editor: un término a la vez, en su propia hoja. */
export default function GlossaryList(props: Props) {
  return (
    <section id="glosario-lista" class={styles.section}>
      <div class={styles.head}>
        <h2 class={styles.title}>Glosario</h2>
      </div>
      <Show
        when={props.entries.length > 0}
        fallback={
          <p class={styles.empty}>
            Sin términos todavía. Si el documento no los usa, el glosario no se
            publica.
          </p>
        }
      >
        <ul class={styles.list}>
          <For each={props.entries}>
            {(entry, index) => (
              <li class={styles.item}>
                <div class={styles.text}>
                  <span class={styles.term}>{entry.term}</span>
                  <span class={styles.definition}>{entry.definition}</span>
                  <Show when={formsOf(props.links, entry.term).length > 0}>
                    <span class={styles.forms}>
                      {formsOf(props.links, entry.term).join(', ')}
                    </span>
                  </Show>
                </div>
                <Button
                  icon={PencilIcon}
                  aria-label={`Editar ${entry.term}`}
                  onClick={() => props.onEdit(index())}
                >
                  Editar
                </Button>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Button icon={PlusIcon} class={styles.add} onClick={props.onAdd}>
        Agregar término
      </Button>
    </section>
  );
}
