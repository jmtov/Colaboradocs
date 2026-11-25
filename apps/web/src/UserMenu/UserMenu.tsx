import { Button, MenuItem, MenuPanel } from '@colaboradocs/review-ui';
import { type Component, For, Show } from 'solid-js';
import { howToAvailable } from '@/HowToReview/howto.state';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import LogOutIcon from '@/icons/LogOutIcon';
import UsersIcon from '@/icons/UsersIcon';
import ThemeSwitch from '@/ThemeSwitch/ThemeSwitch';
import { useUserMenu } from './UserMenu.hooks';
import styles from './UserMenu.module.css';

/** Una acción propia de la página (imprimir, editar…), que va en su propia sección del menú. */
export type UserMenuAction = {
  label: string;
  /** Una línea que explica qué hace, debajo de la etiqueta. */
  description?: string;
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
      <MenuPanel
        ref={(element) => {
          userMenu.refs.menu = element;
        }}
        onToggle={userMenu.onToggle}
        wide
      >
        <Show when={userMenu.me()}>
          {(reviewer) => (
            <div class={styles.who}>
              <Show when={reviewer().isAdmin}>
                <span class={styles.kicker}>Admin</span>
              </Show>
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
            <MenuItem
              icon={ListChecksIcon}
              label="Cómo revisar"
              onClick={userMenu.openHowTo}
            />
          </div>
        </Show>
        <Show when={(props.actions ?? []).length > 0}>
          <div class={styles.group}>
            <For each={props.actions}>
              {(action) => (
                <MenuItem
                  icon={action.icon}
                  label={action.label}
                  description={action.description}
                  onClick={() => userMenu.run(action.onSelect)}
                />
              )}
            </For>
          </div>
        </Show>
        <Show when={userMenu.me()?.isAdmin}>
          <div class={styles.group}>
            <MenuItem
              icon={UsersIcon}
              label="Accesos"
              onClick={() => userMenu.goToAdmin('access')}
            />
          </div>
        </Show>
        <div class={styles.theme}>
          <span class={styles.kicker}>Tema</span>
          <ThemeSwitch fill />
        </div>
        <div class={styles.group}>
          <MenuItem icon={LogOutIcon} label="Salir" onClick={userMenu.logout} />
        </div>
      </MenuPanel>
    </>
  );
}
