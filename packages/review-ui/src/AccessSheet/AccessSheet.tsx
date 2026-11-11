import { createEffect, createSignal, For, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import UserPlusIcon from '../icons/UserPlusIcon';
import { useReview } from '../ReviewProvider/review.context';
import styles from './AccessSheet.module.css';
import AddPersonSheet from './components/AddPersonSheet/AddPersonSheet';
import PersonRow from './components/PersonRow/PersonRow';
import PinResultSheet from './components/PinResultSheet/PinResultSheet';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Pantalla de accesos (solo admins): quién puede entrar, con qué nivel, y su PIN. */
export default function AccessSheet(props: Props) {
  const review = useReview();
  const access = review.access;
  const [adding, setAdding] = createSignal(false);
  const [expanded, setExpanded] = createSignal<string | null>(null);

  createEffect(() => {
    if (props.open) void access.load();
    else setExpanded(null);
  });

  const myId = () => review.snapshot()?.me.id ?? review.session()?.reviewer.id;

  return (
    <>
      <BottomSheet
        open={props.open}
        kicker="Administración"
        title="Accesos"
        compact
        onClose={props.onClose}
      >
        <div class={styles.content}>
          <button
            type="button"
            class={styles.add}
            onClick={() => setAdding(true)}
          >
            <UserPlusIcon class={styles.icon} />
            Agregar persona
          </button>
          <p class={styles.hint}>
            El PIN solo se ve al crearlo o regenerarlo. Si alguien lo pierde,
            hay que regenerarlo.
          </p>
          <Show when={access.status() === 'loading'}>
            <p class={styles.state}>Cargando…</p>
          </Show>
          <Show when={access.status() === 'error'}>
            <p class={styles.state}>
              No se pudo cargar la lista.{' '}
              <button
                type="button"
                class={styles.link}
                onClick={() => void access.load()}
              >
                Reintentar
              </button>
            </p>
          </Show>
          <ul class={styles.list}>
            <For each={access.people() ?? []}>
              {(person) => (
                <PersonRow
                  person={person}
                  isMe={person.id === myId()}
                  expanded={expanded() === person.id}
                  onToggle={() =>
                    setExpanded(expanded() === person.id ? null : person.id)
                  }
                />
              )}
            </For>
          </ul>
        </div>
      </BottomSheet>
      <AddPersonSheet open={adding()} onClose={() => setAdding(false)} />
      <PinResultSheet />
    </>
  );
}
