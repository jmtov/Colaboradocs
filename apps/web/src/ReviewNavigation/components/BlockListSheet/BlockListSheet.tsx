import { BottomSheet, type SheetLayerProps } from '@juntanza/review-ui';
import { For, Show } from 'solid-js';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import { NAV_TITLES } from '@/ReviewNavigation/ReviewNavigation.constants';
import type {
  NavItem,
  NavKind,
} from '@/ReviewNavigation/ReviewNavigation.types';
import styles from './BlockListSheet.module.css';

type Props = SheetLayerProps<string> & {
  kind: NavKind;
  items: NavItem[];
};

/** Hoja con los bloques de un recorrido; elegir uno la cierra con el id del bloque. */
export default function BlockListSheet(props: Props) {
  return (
    <BottomSheet
      open={props.open}
      kicker="Revisión"
      title={NAV_TITLES[props.kind]}
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
                onClick={() => props.close(item.id)}
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
