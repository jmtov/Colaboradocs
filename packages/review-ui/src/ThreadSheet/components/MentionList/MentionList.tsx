import type { ReviewerLabel } from '@colaboradocs/review-core';
import { For, Show } from 'solid-js';
import styles from './MentionList.module.css';

type Props = {
  people: ReviewerLabel[];
  active: number;
  onPick: (person: ReviewerLabel) => void;
};

/** Sugerencias de «@persona» bajo el campo de comentario. */
export default function MentionList(props: Props) {
  return (
    <Show when={props.people.length > 0}>
      <ul class={styles.list} aria-label="Personas">
        <For each={props.people}>
          {(person, index) => (
            <li>
              <button
                type="button"
                class={styles.option}
                classList={{ [styles.active]: index() === props.active }}
                aria-current={index() === props.active}
                // Sin quitar el foco al campo, el cursor se perdería.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => props.onPick(person)}
              >
                <span class={styles.name}>{person.name}</span>
                <Show when={person.municipality}>
                  <span class={styles.municipality}>{person.municipality}</span>
                </Show>
              </button>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
