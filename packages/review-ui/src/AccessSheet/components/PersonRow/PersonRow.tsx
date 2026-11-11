import type { ManagedReviewer } from '@juntanza/review-core';
import { createSignal, Show } from 'solid-js';
import EllipsisVerticalIcon from '../../../icons/EllipsisVerticalIcon';
import { useReview } from '../../../ReviewProvider/review.context';
import styles from './PersonRow.module.css';

type Props = {
  person: ManagedReviewer;
  isMe: boolean;
  expanded: boolean;
  onToggle: () => void;
};

type Confirm = 'pin' | 'remove' | null;

export default function PersonRow(props: Props) {
  const review = useReview();
  const access = review.access;
  const [confirm, setConfirm] = createSignal<Confirm>(null);
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  /** Corre una acción; si falla, avisa. */
  async function run(
    action: () => Promise<{ ok: true } | { ok: false; message: string }>,
    done?: string,
  ) {
    if (busy()) return;
    setBusy(true);
    const result = await action();
    setBusy(false);
    setConfirm(null);
    if (!result.ok) review.flash(result.message);
    else if (done) review.flash(done);
    return result.ok;
  }

  async function saveRole() {
    const value = draft().trim();
    if (!value) return;
    if (await run(() => access.setRole(props.person.id, value))) {
      setEditing(false);
    }
  }

  const role = () =>
    props.person.municipality
      ? review.role.format(props.person.municipality)
      : null;

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
            when={role()}
            fallback={
              <span class={styles.missing}>
                Sin {review.role.label.toLowerCase()}
              </span>
            }
          >
            <span class={styles.role}>{role()}</span>
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
            disabled={props.person.locked || busy()}
            onChange={(event) =>
              void run(() =>
                access.setAdmin(props.person.id, event.currentTarget.checked),
              )
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
            when={editing()}
            fallback={
              <button
                type="button"
                class={styles.action}
                onClick={() => {
                  setDraft(props.person.municipality ?? '');
                  setEditing(true);
                }}
              >
                Editar {review.role.label.toLowerCase()}
              </button>
            }
          >
            <div class={styles.edit}>
              <input
                class={styles.field}
                aria-label={review.role.label}
                value={draft()}
                maxLength={80}
                onInput={(event) => setDraft(event.currentTarget.value)}
              />
              <button
                type="button"
                class={`${styles.action} ${styles.primary}`}
                disabled={busy() || !draft().trim()}
                onClick={() => void saveRole()}
              >
                Guardar
              </button>
              <button
                type="button"
                class={styles.action}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </Show>

          <Show when={!props.person.locked}>
            <button
              type="button"
              class={styles.action}
              disabled={busy()}
              onClick={() =>
                void run(
                  () => access.resetDevices(props.person.id),
                  'Dispositivos restablecidos.',
                )
              }
            >
              Restablecer dispositivos
            </button>

            <Show
              when={confirm() === 'pin'}
              fallback={
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => setConfirm('pin')}
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
                  disabled={busy()}
                  onClick={() =>
                    void run(() => access.regeneratePin(props.person.id))
                  }
                >
                  Regenerar
                </button>
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </button>
              </div>
            </Show>

            <Show
              when={confirm() === 'remove'}
              fallback={
                <button
                  type="button"
                  class={`${styles.action} ${styles.danger}`}
                  onClick={() => setConfirm('remove')}
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
                  disabled={busy()}
                  onClick={() => void run(() => access.remove(props.person.id))}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => setConfirm(null)}
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
