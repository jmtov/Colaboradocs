import { BottomSheet } from '@juntanza/review-ui';
import { For, Show } from 'solid-js';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import { NAV_TITLES } from '@/ReviewNavigation/ReviewNavigation.constants';
import type {
  NavItem,
  NavKind,
} from '@/ReviewNavigation/ReviewNavigation.types';
import styles from './BlockListSheet.module.css';

type Props = {
  /** `null`: cerrada. */
  kind: NavKind | null;
  items: NavItem[];
  onPick: (id: string) => void;
  onClose: () => void;
};

/** Hoja con los bloques de un recorrido; elegir uno cierra la hoja y va a él. */
export default function BlockListSheet(props: Props) {
  return (
    <BottomSheet
      open={props.kind !== null}
      kicker="Revisión"
      title={props.kind ? NAV_TITLES[props.kind] : ''}
      onClose={props.onClose}
    >
      <Show
        when={props.items.length > 0}
        fallback={<p class={styles.empty}>No hay bloques en esta lista.</p>}
      >
        <nav class={styles.list} aria-label="Bloques">
          <For each={props.items}>
            {(item) => (
              <button
                type="button"
                class={styles.item}
                data-flat
                onClick={() => props.onPick(item.id)}
              >
                <span class={styles.body}>
                  <span class={styles.section}>
                    {item.section}
                    <Show when={item.meta}> · {item.meta}</Show>
                  </span>
                  <span class={styles.text}>{item.text}</span>
                </span>
                <ArrowRightIcon class={styles.icon} />
              </button>
            )}
          </For>
        </nav>
      </Show>
    </BottomSheet>
  );
}
