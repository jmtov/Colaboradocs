import { For } from 'solid-js';
import CollapsibleSection from '@/document/DocumentPage/components/CollapsibleSection/CollapsibleSection';
import styles from './ReviewSummary.module.css';

type Tile = { label: string; value: string; onClick: () => void };

export default function ReviewSummary(props: { tiles: Tile[] }) {
  return (
    <CollapsibleSection
      id="summary-title"
      title="Estado de la revisión"
      defaultOpen={false}
      class={styles.section}
    >
      <div class={styles.summary}>
        <For each={props.tiles}>
          {(tile) => (
            <button type="button" class={styles.tile} onClick={tile.onClick}>
              <span class={styles.label}>{tile.label}</span>
              <span class={styles.value}>{tile.value}</span>
            </button>
          )}
        </For>
      </div>
    </CollapsibleSection>
  );
}
