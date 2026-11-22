import { createUniqueId, For, type JSX, Show } from 'solid-js';
import CheckIcon from '../icons/CheckIcon';
import { useMenuPosition } from './ActionMenu.hooks';
import styles from './ActionMenu.module.css';
import type { MenuGroup } from './ActionMenu.types';

interface ActionMenuProps {
  /** Lo que lleva el botón (un icono, con texto si hace falta). */
  trigger: JSX.Element;
  /** Texto accesible del botón. */
  label: string;
  groups: MenuGroup[];
  class?: string;
}

/** Un botón que abre un menú de acciones. Usa `popover`: se cierra al pulsar fuera o con Esc, y queda por encima del scroll del panel. */
export default function ActionMenu(props: ActionMenuProps) {
  const id = createUniqueId();
  const position = useMenuPosition();
  return (
    <>
      <button
        ref={position.setTrigger}
        type="button"
        class={`${styles.trigger} ${props.class ?? ''}`}
        popovertarget={id}
        aria-label={props.label}
        title={props.label}
      >
        {props.trigger}
      </button>
      <div
        id={id}
        ref={position.setMenu}
        popover="auto"
        class={styles.menu}
        onToggle={position.place}
      >
        <For each={props.groups}>
          {(group) => (
            <div class={styles.group}>
              <Show when={group.title}>
                <p class={styles.title}>{group.title}</p>
              </Show>
              <For each={group.items}>
                {(item) => (
                  <button
                    type="button"
                    class={styles.item}
                    classList={{ [styles.danger as string]: item.danger }}
                    disabled={item.disabled}
                    onClick={() => {
                      position.close();
                      item.onSelect();
                    }}
                  >
                    <span class={styles.icon}>{item.icon}</span>
                    <span class={styles.text}>
                      {item.label}
                      <Show when={item.help}>
                        <small class={styles.help}>{item.help}</small>
                      </Show>
                    </span>
                    <span class={styles.check}>
                      {item.checked && <CheckIcon />}
                    </span>
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </>
  );
}
