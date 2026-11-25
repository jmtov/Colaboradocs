import EllipsisVerticalIcon from 'lucide-solid/icons/ellipsis-vertical';
import { type Component, For, Show } from 'solid-js';
import Button from '../Button/Button';
import MenuItem from '../MenuItem/MenuItem';
import MenuPanel from '../MenuPanel/MenuPanel';
import { useActionMenu } from './ActionMenu.hooks';
import styles from './ActionMenu.module.css';
import type { ActionMenuGroup, ActionMenuItem } from './ActionMenu.types';

type Props = {
  /** Nombre accesible del botón. */
  label: string;
  /** Las acciones, en un solo grupo; o `groups`, si hay varios. */
  items?: ActionMenuItem[];
  groups?: ActionMenuGroup[];
  /** Aviso fijo arriba del menú (p. ej. por qué faltan acciones). */
  note?: string;
  /** Tamaño del botón; `md` por omisión. */
  size?: 'md' | 'sm' | 'xs';
  /** Con texto, el botón lo lleva junto al ícono («Opciones»); sin él, solo el ícono. */
  triggerLabel?: string;
  /** El ícono del botón; por omisión, los tres puntos. */
  triggerIcon?: Component<{ class?: string }>;
};

/** Un botón que abre un menú de acciones con íconos y, si hace falta, descripciones (popover nativo: capa superior, Esc, tocar fuera). */
export default function ActionMenu(props: Props) {
  const menu = useActionMenu();
  const groups = (): ActionMenuGroup[] =>
    props.groups ?? [{ items: props.items ?? [] }];

  return (
    <>
      <Button
        icon={props.triggerIcon ?? EllipsisVerticalIcon}
        size={props.size}
        ref={menu.refs.trigger}
        aria-label={props.label}
        aria-haspopup="true"
        aria-expanded={menu.open()}
        onClick={menu.toggle}
      >
        {props.triggerLabel}
      </Button>
      <MenuPanel
        ref={(element) => {
          menu.refs.menu = element;
        }}
        onToggle={menu.onToggle}
        wide
      >
        <Show when={props.note}>
          <p class={styles.note}>{props.note}</p>
        </Show>
        <For each={groups()}>
          {(group) => (
            <div class={styles.group}>
              <Show when={group.title}>
                <p class={styles.title}>{group.title}</p>
              </Show>
              <For each={group.items}>
                {(item) => (
                  <MenuItem
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                    danger={item.danger}
                    disabled={item.disabled}
                    checked={item.checked}
                    onClick={() => menu.select(item)}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </MenuPanel>
    </>
  );
}
