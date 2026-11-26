import { BottomSheet } from '@colaboradocs/review-ui';
import { For } from 'solid-js';
import styles from './OptionSheet.module.css';
import type { OptionSheetProps } from './OptionSheet.types';

/** Una lista de opciones con ícono, nombre y explicación; tocar una la elige y cierra. */
export default function OptionSheet(props: OptionSheetProps) {
  return (
    <BottomSheet
      open={props.open}
      kicker={props.kicker}
      title={props.title}
      compact
      onClose={props.onClose}
    >
      <ul class={styles.list}>
        <For each={props.options}>
          {(option) => (
            <li class={styles.item}>
              <button
                type="button"
                class={styles.option}
                aria-pressed={
                  props.selected === undefined
                    ? undefined
                    : props.selected === option.id
                }
                onClick={() => props.close(option.id)}
              >
                <option.icon class={styles.icon} />
                <span class={styles.label}>{option.label}</span>
                <span class={styles.description}>{option.description}</span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </BottomSheet>
  );
}
