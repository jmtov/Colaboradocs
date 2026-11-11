import { For } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import type { SheetLayerProps } from '../overlay/overlay.types';
import { useApprovalsSheet } from './ApprovalsSheet.hooks';
import styles from './ApprovalsSheet.module.css';

type Props = SheetLayerProps & {
  blockId: string;
  /** Texto del bloque, para saber de qué párrafo son los OK. */
  blockText: string;
};

/** Quién ha dado OK a un párrafo y en qué momento. */
export default function ApprovalsSheet(props: Props) {
  const sheet = useApprovalsSheet(() => props.blockId);

  return (
    <BottomSheet
      open={props.open}
      kicker="OK"
      title="Quién dio OK"
      compact
      onClose={props.onClose}
    >
      <blockquote class={styles.paragraph}>{props.blockText}</blockquote>
      <ul class={styles.list}>
        <For
          each={sheet.rows()}
          fallback={<li class={styles.empty}>Todavía nadie dio OK.</li>}
        >
          {(row) => (
            <li class={styles.row}>
              <span class={styles.who}>{row.who}</span>
              <time class={styles.when} datetime={row.iso}>
                {row.when}
              </time>
            </li>
          )}
        </For>
      </ul>
    </BottomSheet>
  );
}
