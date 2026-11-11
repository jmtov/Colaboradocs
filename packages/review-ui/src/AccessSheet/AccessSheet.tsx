import { For, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import UserPlusIcon from '../icons/UserPlusIcon';
import type { SheetLayerProps } from '../overlay/overlay.types';
import { useAccessSheet } from './AccessSheet.hooks';
import styles from './AccessSheet.module.css';
import PersonRow from './components/PersonRow/PersonRow';

/** Pantalla de accesos (solo admins): quién puede entrar, con qué nivel, y su PIN. */
export default function AccessSheet(props: SheetLayerProps) {
  const sheet = useAccessSheet();

  return (
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
          onClick={() => sheet.openAdd()}
        >
          <UserPlusIcon class={styles.icon} />
          Agregar persona
        </button>
        <p class={styles.hint}>
          El PIN solo se ve al crearlo o regenerarlo. Si alguien lo pierde, hay
          que regenerarlo.
        </p>
        <Show when={sheet.status() === 'loading'}>
          <p class={styles.state}>Cargando…</p>
        </Show>
        <Show when={sheet.status() === 'error'}>
          <p class={styles.state}>
            No se pudo cargar la lista.{' '}
            <button
              type="button"
              class={styles.link}
              onClick={() => sheet.reload()}
            >
              Reintentar
            </button>
          </p>
        </Show>
        <ul class={styles.list}>
          <For each={sheet.people() ?? []}>
            {(person) => (
              <PersonRow
                person={person}
                isMe={person.id === sheet.myId()}
                expanded={sheet.expanded() === person.id}
                onToggle={() => sheet.toggleExpanded(person.id)}
              />
            )}
          </For>
        </ul>
      </div>
    </BottomSheet>
  );
}
