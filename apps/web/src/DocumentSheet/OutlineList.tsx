import { For } from 'solid-js';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import styles from './OutlineList.module.css';
import { type OutlineItem, readOutline } from './outline.utils';

const LEVEL_CLASS: Record<OutlineItem['level'], string | undefined> = {
  1: styles.level1,
  2: styles.level2,
  3: styles.level3,
};

export default function OutlineList(props: { onPick: (id: string) => void }) {
  const items = readOutline();
  return (
    <nav class={styles.list} aria-label="Contenido del documento">
      <For each={items}>
        {(item) => (
          <button
            type="button"
            class={`${styles.item} ${LEVEL_CLASS[item.level] ?? ''}`}
            onClick={() => props.onPick(item.id)}
          >
            <span>{item.text}</span>
            <ArrowRightIcon class={styles.icon} />
          </button>
        )}
      </For>
    </nav>
  );
}
