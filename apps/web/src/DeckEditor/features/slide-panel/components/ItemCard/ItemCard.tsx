import type { JSX } from 'solid-js';
import styles from './ItemCard.module.css';

interface ItemCardProps {
  name: string;
  index: number;
  count: number;
  canRemove?: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: JSX.Element;
}

/** Un elemento de una lista o un bloque: su nombre, subirlo, bajarlo, quitarlo, y sus campos debajo. */
export default function ItemCard(props: ItemCardProps) {
  const stop = (action: () => void) => (e: MouseEvent) => {
    e.preventDefault();
    action();
  };
  return (
    <details class={styles.item} open>
      <summary class={styles.bar}>
        <span class={styles.name}>{props.name}</span>
        <button
          type="button"
          class="btn"
          disabled={props.index === 0}
          onClick={stop(() => props.onMove(props.index - 1))}
          title="Subir"
        >
          ↑
        </button>
        <button
          type="button"
          class="btn"
          disabled={props.index === props.count - 1}
          onClick={stop(() => props.onMove(props.index + 1))}
          title="Bajar"
        >
          ↓
        </button>
        <button
          type="button"
          class="btn danger"
          disabled={props.canRemove === false}
          onClick={stop(props.onRemove)}
          title="Quitar"
        >
          ×
        </button>
      </summary>
      <div class={styles.body}>{props.children}</div>
    </details>
  );
}
