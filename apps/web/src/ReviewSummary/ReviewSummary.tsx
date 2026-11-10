import { For } from 'solid-js';
import styles from './ReviewSummary.module.css';

type Tile = { label: string; value: string };

export default function ReviewSummary(props: { tiles: Tile[] }) {
  return (
    <dl class={styles.summary}>
      <For each={props.tiles}>
        {(tile) => (
          <div class={styles.tile}>
            <dt class={styles.label}>{tile.label}</dt>
            <dd class={styles.value}>{tile.value}</dd>
          </div>
        )}
      </For>
    </dl>
  );
}
