import { AccessSheet, useReview } from '@juntanza/review-ui';
import { createSignal, Show } from 'solid-js';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import LogOutIcon from '@/icons/LogOutIcon';
import UsersIcon from '@/icons/UsersIcon';
import styles from './UserMenu.module.css';

/** Separación entre el botón y el menú, en px. */
const MENU_GAP_PX = 6;

/** Tres puntos en el encabezado: abre un menú con quién eres y «Salir». */
export default function UserMenu() {
  const review = useReview();
  let trigger!: HTMLButtonElement;
  let menu!: HTMLDivElement;
  const [open, setOpen] = createSignal(false);
  const [accessOpen, setAccessOpen] = createSignal(false);

  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;

  function toggle() {
    if (!menu.matches(':popover-open')) {
      // El popover vive en la capa superior: se ubica bajo el botón, alineado a la derecha.
      const rect = trigger.getBoundingClientRect();
      menu.style.top = `${rect.bottom + MENU_GAP_PX}px`;
      menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    }
    menu.togglePopover();
  }

  function openAccess() {
    menu.hidePopover();
    setAccessOpen(true);
  }

  function logout() {
    menu.hidePopover();
    review.logout();
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        class={styles.trigger}
        classList={{ [styles.open]: open() }}
        aria-label="Menú de la sesión"
        aria-haspopup="true"
        aria-expanded={open()}
        onClick={toggle}
      >
        <EllipsisVerticalIcon class={styles.icon} />
      </button>
      <div
        ref={menu}
        popover
        class={styles.menu}
        on:toggle={(event: ToggleEvent) => setOpen(event.newState === 'open')}
      >
        <Show when={me()}>
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
        <Show when={me()?.isAdmin}>
          <button type="button" class={styles.item} onClick={openAccess}>
            <UsersIcon class={styles.icon} />
            Accesos
          </button>
        </Show>
        <button type="button" class={styles.item} onClick={logout}>
          <LogOutIcon class={styles.icon} />
          Salir
        </button>
      </div>
      <Show when={me()?.isAdmin}>
        <AccessSheet open={accessOpen()} onClose={() => setAccessOpen(false)} />
      </Show>
    </>
  );
}
