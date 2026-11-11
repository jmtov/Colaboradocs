import { For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';
import { useActionMenu } from './ActionMenu.hooks';
import styles from './ActionMenu.module.css';
import type { ActionMenuItem } from './ActionMenu.types';

type Props = {
  /** Nombre accesible del botón de los tres puntos. */
  label: string;
  items: ActionMenuItem[];
  /** Aviso fijo arriba del menú (p. ej. por qué faltan acciones). */
  note?: string;
};

/** Tres puntos que abren un menú de acciones con íconos (popover nativo: capa superior, Esc, tocar fuera). */
export default function ActionMenu(props: Props) {
  const menu = useActionMenu();

  return (
    <>
      <button
        ref={menu.refs.trigger}
        type="button"
        class={styles.trigger}
        classList={{ [styles.open]: menu.open() }}
        aria-label={props.label}
        aria-haspopup="true"
        aria-expanded={menu.open()}
        onClick={menu.toggle}
      >
        <EllipsisVerticalIcon class={styles.icon} />
      </button>
      <div
        ref={menu.refs.menu}
        popover
        class={styles.menu}
        on:toggle={menu.onToggle}
      >
        <Show when={props.note}>
          <p class={styles.note}>{props.note}</p>
        </Show>
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              class={styles.item}
              classList={{ [styles.danger]: item.danger }}
              data-flat
              disabled={item.disabled}
              onClick={() => menu.select(item)}
            >
              <Dynamic component={item.icon} class={styles.icon} />
              {item.label}
            </button>
          )}
        </For>
      </div>
    </>
  );
}
