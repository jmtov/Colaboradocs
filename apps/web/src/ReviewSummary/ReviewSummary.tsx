import { For } from 'solid-js';
import styles from './ReviewSummary.module.css';

type Tile = { label: string; value: string; onClick: () => void };

export default function ReviewSummary(props: { tiles: Tile[] }) {
  return (
    <section class={styles.summary} aria-label="Resumen de la revisión">
      <For each={props.tiles}>
        {(tile) => (
          <button type="button" class={styles.tile} onClick={tile.onClick}>
            <span class={styles.label}>{tile.label}</span>
            <span class={styles.value}>{tile.value}</span>
          </button>
        )}
      </For>
    </section>
  );
}
