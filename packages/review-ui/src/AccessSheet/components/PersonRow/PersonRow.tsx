import type { ManagedReviewer } from '@juntanza/review-core';
import { Show } from 'solid-js';
import EllipsisVerticalIcon from '../../../icons/EllipsisVerticalIcon';
import { ROLE_EDIT_MAX_LENGTH } from './PersonRow.constants';
import { usePersonRow } from './PersonRow.hooks';
import styles from './PersonRow.module.css';

type Props = {
  person: ManagedReviewer;
  isMe: boolean;
  expanded: boolean;
  onToggle: () => void;
};

export default function PersonRow(props: Props) {
  const row = usePersonRow(() => props.person);

  return (
    <li class={styles.row}>
      <div class={styles.main}>
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
        <button
          type="button"
          class={styles.more}
          aria-label={`Acciones para ${props.person.name}`}
          aria-expanded={props.expanded}
          onClick={props.onToggle}
        >
          <EllipsisVerticalIcon class={styles.icon} />
        </button>
      </div>

      <Show when={props.expanded}>
        <div class={styles.actions}>
          <Show when={props.person.locked}>
            <p class={styles.note}>
              {props.isMe
                ? 'Eres tú: no puedes cambiar tu propio acceso.'
                : 'Esta persona te dio acceso (o lo dio a quien te lo dio): no puedes cambiar su acceso.'}
            </p>
          </Show>

          <Show
            when={row.editing()}
            fallback={
              <button
                type="button"
                class={styles.action}
                onClick={() => row.startEdit()}
              >
                Editar {row.roleLabel().toLowerCase()}
              </button>
            }
          >
            <div class={styles.edit}>
              <input
                class={styles.field}
                aria-label={row.roleLabel()}
                value={row.draft()}
                maxLength={ROLE_EDIT_MAX_LENGTH}
                onInput={(event) => row.updateDraft(event.currentTarget.value)}
              />
              <button
                type="button"
                class={`${styles.action} ${styles.primary}`}
                disabled={row.busy() || !row.draft().trim()}
                onClick={() => row.saveRole()}
              >
                Guardar
              </button>
              <button
                type="button"
                class={styles.action}
                onClick={() => row.cancelEdit()}
              >
                Cancelar
              </button>
            </div>
          </Show>

          <Show when={!props.person.locked}>
            <button
              type="button"
              class={styles.action}
              disabled={row.busy()}
              onClick={() => void row.resetDevices()}
            >
              Restablecer dispositivos
            </button>

            <Show
              when={row.confirm() === 'pin'}
              fallback={
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => row.askConfirm('pin')}
                >
                  Regenerar PIN
                </button>
              }
            >
              <div class={styles.confirm}>
                <span>
                  El PIN actual deja de servir y {props.person.name} queda fuera
                  hasta recibir el nuevo.
                </span>
                <button
                  type="button"
                  class={`${styles.action} ${styles.primary}`}
                  disabled={row.busy()}
                  onClick={() => void row.regeneratePin()}
                >
                  Regenerar
                </button>
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => row.cancelConfirm()}
                >
                  Cancelar
                </button>
              </div>
            </Show>

            <Show
              when={row.confirm() === 'remove'}
              fallback={
                <button
                  type="button"
                  class={`${styles.action} ${styles.danger}`}
                  onClick={() => row.askConfirm('remove')}
                >
                  Eliminar
                </button>
              }
            >
              <div class={styles.confirm}>
                <span>
                  {props.person.name} pierde el acceso. Sus comentarios se
                  conservan.
                </span>
                <button
                  type="button"
                  class={`${styles.action} ${styles.dangerSolid}`}
                  disabled={row.busy()}
                  onClick={() => void row.removePerson()}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => row.cancelConfirm()}
                >
                  Cancelar
                </button>
              </div>
            </Show>
          </Show>
        </div>
      </Show>
    </li>
  );
}
