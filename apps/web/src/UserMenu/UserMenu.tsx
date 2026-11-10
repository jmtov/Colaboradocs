import { AccessSheet, useReview } from '@juntanza/review-ui';
import { createSignal, Show } from 'solid-js';
import { setDocumentsOpen } from '@/DocumentsSheet/documentsSheet.state';
import { howToAvailable, setHowToOpen } from '@/HowToReview/howto.state';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import FileTextIcon from '@/icons/FileTextIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import LogOutIcon from '@/icons/LogOutIcon';
import UsersIcon from '@/icons/UsersIcon';
import ThemeSwitch from '@/ThemeSwitch/ThemeSwitch';
import { openAfterMenuCloses } from './menu.utils';
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
    openAfterMenuCloses(menu, () => setAccessOpen(true));
  }

  function openHowTo() {
    openAfterMenuCloses(menu, () => setHowToOpen(true));
  }

  function openDocuments() {
    openAfterMenuCloses(menu, () => setDocumentsOpen(true));
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
        <div class={styles.theme}>
          <span class={styles.kicker}>Tema</span>
          <ThemeSwitch fill />
        </div>
        <Show when={howToAvailable()}>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={openHowTo}
          >
            <ListChecksIcon class={styles.icon} />
            Cómo revisar
          </button>
        </Show>
        <Show when={me()?.isAdmin}>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={openDocuments}
          >
            <FileTextIcon class={styles.icon} />
            Documentos
          </button>
          <button
            type="button"
            class={styles.item}
            data-flat
            onClick={openAccess}
          >
            <UsersIcon class={styles.icon} />
            Accesos
          </button>
        </Show>
        <button type="button" class={styles.item} data-flat onClick={logout}>
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
