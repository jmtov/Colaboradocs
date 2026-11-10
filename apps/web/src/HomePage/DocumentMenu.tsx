import { useReview } from '@juntanza/review-ui';
import { createSignal, Show } from 'solid-js';
import { setUploadTarget } from '@/DocumentsSheet/documentsSheet.state';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import { openAfterMenuCloses } from '@/UserMenu/menu.utils';
import styles from './DocumentMenu.module.css';

/** Separación entre el botón y el menú, en px. */
const MENU_GAP_PX = 6;

type Props = {
  id: string;
  title: string;
};

/** Menú de un documento (solo admins): reemplazar el archivo o archivarlo. */
export default function DocumentMenu(props: Props) {
  const review = useReview();
  let trigger!: HTMLButtonElement;
  let menu!: HTMLDivElement;
  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  function toggle() {
    if (!menu.matches(':popover-open')) {
      // El popover vive en la capa superior: se ubica bajo el botón, alineado a la derecha.
      const rect = trigger.getBoundingClientRect();
      menu.style.top = `${rect.bottom + MENU_GAP_PX}px`;
      menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    }
    menu.togglePopover();
  }

  function replace() {
    openAfterMenuCloses(menu, () => setUploadTarget({ replaceId: props.id }));
  }

  async function archive() {
    setBusy(true);
    const result = await review.archiveDocument(props.id);
    setBusy(false);
    menu.hidePopover();
    review.flash(result.ok ? 'Documento archivado.' : result.message);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        class={styles.trigger}
        classList={{ [styles.open]: open() }}
        aria-label={`Acciones de «${props.title}»`}
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
        on:toggle={(event: ToggleEvent) => {
          setOpen(event.newState === 'open');
          if (event.newState === 'closed') setConfirming(false);
        }}
      >
        <Show
          when={confirming()}
          fallback={
            <>
              <button
                type="button"
                class={styles.item}
                data-flat
                onClick={replace}
              >
                Reemplazar documento
              </button>
              <button
                type="button"
                class={`${styles.item} ${styles.danger}`}
                data-flat
                onClick={() => setConfirming(true)}
              >
                Archivar
              </button>
            </>
          }
        >
          <p class={styles.confirm}>
            Se oculta de la home. Sus comentarios se conservan y reaparecen si
            lo vuelves a subir.
          </p>
          <div class={styles.row}>
            <button
              type="button"
              class={`${styles.item} ${styles.dangerSolid}`}
              data-flat
              disabled={busy()}
              onClick={() => void archive()}
            >
              Archivar
            </button>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          </div>
        </Show>
      </div>
    </>
  );
}
