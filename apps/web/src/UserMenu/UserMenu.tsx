import { Show } from 'solid-js';
import { howToAvailable } from '@/HowToReview/howto.state';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import FileTextIcon from '@/icons/FileTextIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import LogOutIcon from '@/icons/LogOutIcon';
import UsersIcon from '@/icons/UsersIcon';
import ThemeSwitch from '@/ThemeSwitch/ThemeSwitch';
import { useUserMenu } from './UserMenu.hooks';
import styles from './UserMenu.module.css';

/** Tres puntos en el encabezado: abre un menú con quién eres y «Salir». */
export default function UserMenu() {
  const userMenu = useUserMenu();

  return (
    <>
      <button
        ref={userMenu.refs.trigger}
        type="button"
        class={styles.trigger}
        classList={{ [styles.open]: userMenu.open() }}
        aria-label="Menú de la sesión"
        aria-haspopup="true"
        aria-expanded={userMenu.open()}
        onClick={userMenu.toggle}
      >
        <EllipsisVerticalIcon class={styles.icon} />
      </button>
      <div
        ref={userMenu.refs.menu}
        popover
        class={styles.menu}
        on:toggle={userMenu.onToggle}
      >
        <Show when={userMenu.me()}>
          {(reviewer) => (
            <div class={styles.who}>
              <span class={styles.kicker}>
                {reviewer().isAdmin ? 'Sesión · admin' : 'Sesión'}
              </span>
              <span class={styles.name}>{reviewer().name}</span>
              <Show when={reviewer().municipality}>
                {(municipality) => (
                  <span class={styles.municipality}>{municipality()}</span>
                )}
              </Show>
            </div>
          )}
        </Show>
        <div class={styles.theme}>
          <span class={styles.kicker}>Tema</span>
          <ThemeSwitch fill />
        </div>
        <Show when={howToAvailable()}>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={userMenu.openHowTo}
          >
            <ListChecksIcon class={styles.icon} />
            Cómo revisar
          </button>
        </Show>
        <Show when={userMenu.me()?.isAdmin}>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={userMenu.openDocuments}
          >
            <FileTextIcon class={styles.icon} />
            Documentos
          </button>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={userMenu.openAccess}
          >
            <UsersIcon class={styles.icon} />
            Accesos
          </button>
        </Show>
        <button
          type="button"
          class={styles.item}
          data-flat
          onClick={userMenu.logout}
        >
          <LogOutIcon class={styles.icon} />
          Salir
        </button>
      </div>
    </>
  );
}
