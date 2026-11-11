import type { ManagedReviewer } from '@juntanza/review-core';
import { Show } from 'solid-js';
import ActionMenu from '../../../ActionMenu/ActionMenu';
import { usePersonRow } from './PersonRow.hooks';
import styles from './PersonRow.module.css';

type Props = {
  person: ManagedReviewer;
  isMe: boolean;
};

export default function PersonRow(props: Props) {
  const row = usePersonRow(() => props.person);

  return (
    <li class={styles.row}>
      <div class={styles.who}>
        <span class={styles.name}>
          {props.person.name}
          <Show when={props.isMe}>
            <span class={styles.tag}>Tú</span>
          </Show>
        </span>
        <Show
          when={row.role()}
          fallback={
            <span class={styles.missing}>
              Sin {row.roleLabel().toLowerCase()}
            </span>
          }
        >
          <span class={styles.role}>{row.role()}</span>
        </Show>
        <span class={styles.meta}>
          {props.person.devices}/{props.person.maxDevices} dispositivos
        </span>
      </div>
      <label
        class={styles.switch}
        classList={{ [styles.disabled]: props.person.locked }}
        title={
          props.person.locked
            ? 'No puedes cambiar el acceso de esta persona.'
            : undefined
        }
      >
        <input
          type="checkbox"
          checked={props.person.isAdmin}
          disabled={props.person.locked || row.busy()}
          onChange={(event) =>
            void row.toggleAdmin(event.currentTarget.checked)
          }
        />
        Admin
      </label>
      <ActionMenu
        label={`Acciones para ${props.person.name}`}
        items={row.menuItems()}
        note={row.lockedNote(props.isMe)}
      />
    </li>
  );
}
