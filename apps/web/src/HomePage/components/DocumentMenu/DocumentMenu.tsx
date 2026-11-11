import { Show } from 'solid-js';
import ArchiveIcon from '@/icons/ArchiveIcon';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import UploadIcon from '@/icons/UploadIcon';
import { useDocumentMenu } from './DocumentMenu.hooks';
import styles from './DocumentMenu.module.css';

type Props = {
  id: string;
  title: string;
};

/** Menú de un documento (solo admins): reemplazar el archivo o archivarlo. */
export default function DocumentMenu(props: Props) {
  const documentMenu = useDocumentMenu(() => props.id);

  return (
    <>
      <button
        ref={documentMenu.refs.trigger}
        type="button"
        class={styles.trigger}
        classList={{ [styles.open]: documentMenu.open() }}
        aria-label={`Acciones de «${props.title}»`}
        aria-haspopup="true"
        aria-expanded={documentMenu.open()}
        onClick={documentMenu.toggle}
      >
        <EllipsisVerticalIcon class={styles.icon} />
      </button>
      <div
        ref={documentMenu.refs.menu}
        popover
        class={styles.menu}
        on:toggle={documentMenu.onToggle}
      >
        <Show
          when={documentMenu.confirming()}
          fallback={
            <>
              <button
                type="button"
                class={styles.item}
                data-flat
                onClick={documentMenu.replace}
              >
                <UploadIcon class={styles.itemIcon} />
                Reemplazar documento
              </button>
              <button
                type="button"
                class={`${styles.item} ${styles.danger}`}
                data-flat
                onClick={documentMenu.askArchive}
              >
                <ArchiveIcon class={styles.itemIcon} />
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
              disabled={documentMenu.busy()}
              onClick={() => void documentMenu.archive()}
            >
              Archivar
            </button>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={documentMenu.cancelArchive}
            >
              Cancelar
            </button>
          </div>
        </Show>
      </div>
    </>
  );
}
