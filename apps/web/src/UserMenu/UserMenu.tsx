import { Button } from '@colaboradocs/review-ui';
import { type Component, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { howToAvailable } from '@/HowToReview/howto.state';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import FileTextIcon from '@/icons/FileTextIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import LogOutIcon from '@/icons/LogOutIcon';
import UsersIcon from '@/icons/UsersIcon';
import ThemeSwitch from '@/ThemeSwitch/ThemeSwitch';
import { useUserMenu } from './UserMenu.hooks';
import styles from './UserMenu.module.css';

/** Una acción propia de la página (imprimir, editar…), que va en su propia sección del menú. */
export type UserMenuAction = {
  label: string;
  icon: Component<{ class?: string }>;
  onSelect: () => void;
};

type Props = {
  /** Acciones de la página donde está el menú; van después de «Cómo revisar». */
  actions?: UserMenuAction[];
};

/**
 * Tres puntos en el encabezado. El menú va por secciones, separadas por una línea: quién
 * eres · cómo revisar · acciones de la página · administración · tema · salir.
 */
export default function UserMenu(props: Props) {
  const userMenu = useUserMenu();

  return (
    <>
      <Button
        icon={EllipsisVerticalIcon}
        size="sm"
        ref={userMenu.refs.trigger}
        aria-label="Menú de la sesión"
        aria-haspopup="true"
        aria-expanded={userMenu.open()}
        onClick={userMenu.toggle}
      />
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
        <Show when={howToAvailable()}>
          <div class={styles.group}>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={userMenu.openHowTo}
            >
              <ListChecksIcon class={styles.icon} />
              Cómo revisar
            </button>
          </div>
        </Show>
        <Show when={(props.actions ?? []).length > 0}>
          <div class={styles.group}>
            <For each={props.actions}>
              {(action) => (
                <button
                  type="button"
                  class={styles.item}
                  data-flat
                  onClick={() => userMenu.run(action.onSelect)}
                >
                  <Dynamic component={action.icon} class={styles.icon} />
                  {action.label}
                </button>
              )}
            </For>
          </div>
        </Show>
        <Show when={userMenu.me()?.isAdmin}>
          <div class={styles.group}>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={() => userMenu.goToAdmin('documents')}
            >
              <FileTextIcon class={styles.icon} />
              Documentos
            </button>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={() => userMenu.goToAdmin('access')}
            >
              <UsersIcon class={styles.icon} />
              Accesos
            </button>
          </div>
        </Show>
        <div class={styles.theme}>
          <span class={styles.kicker}>Tema</span>
          <ThemeSwitch fill />
        </div>
        <div class={styles.group}>
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
      </div>
    </>
  );
}
