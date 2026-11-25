import { For } from 'solid-js';
import Skeleton from './Skeleton';
import styles from './SkeletonLines.module.css';

type Props = {
  /** Cuántas líneas; la última sale más corta, como el final de un párrafo. */
  lines: number;
};

/** Un párrafo de relleno. */
export default function SkeletonLines(props: Props) {
  return (
    <div class={styles.lines}>
      <For each={Array.from({ length: props.lines }, (_, i) => i)}>
        {(i) => <Skeleton width={i === props.lines - 1 ? '60%' : '100%'} />}
      </For>
    </div>
  );
}
