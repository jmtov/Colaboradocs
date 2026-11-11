import { For, Show } from 'solid-js';
import Button from '../Button/Button';
import RefreshIcon from '../icons/RefreshIcon';
import UserPlusIcon from '../icons/UserPlusIcon';
import { useAccessPanel } from './AccessPanel.hooks';
import styles from './AccessPanel.module.css';
import PersonRow from './components/PersonRow/PersonRow';

/** Accesos (solo admins): quién puede entrar, con qué nivel, y su PIN. Es contenido: la página lo enmarca. */
export default function AccessPanel() {
  const panel = useAccessPanel();

  return (
    <div class={styles.content}>
      <Button
        icon={UserPlusIcon}
        class={styles.add}
        onClick={() => panel.openAdd()}
      >
        Agregar persona
      </Button>
      <p class={styles.hint}>
        El PIN solo se ve al crearlo o regenerarlo. Si alguien lo pierde, hay
        que regenerarlo.
      </p>
      <Show when={panel.status() === 'loading'}>
        <p class={styles.state}>Cargando…</p>
      </Show>
      <Show when={panel.status() === 'error'}>
        <p class={styles.state}>
          No se pudo cargar la lista.{' '}
          <Button icon={RefreshIcon} onClick={() => panel.reload()}>
            Reintentar
          </Button>
        </p>
      </Show>
      <ul class={styles.list}>
        <For each={panel.people() ?? []}>
          {(person) => (
            <PersonRow person={person} isMe={person.id === panel.myId()} />
          )}
        </For>
      </ul>
    </div>
  );
}
