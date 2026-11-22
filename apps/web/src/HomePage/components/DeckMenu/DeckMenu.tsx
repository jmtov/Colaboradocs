import { Button } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import ArchiveIcon from '@/icons/ArchiveIcon';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import PencilIcon from '@/icons/PencilIcon';
import { useDeckMenu } from './DeckMenu.hooks';
import styles from './DeckMenu.module.css';

type Props = {
  id: string;
  title: string;
  /** Se llama tras archivar, para que la home vuelva a pedir la lista. */
  onChange: () => void;
};

/** Menú de una presentación (solo admins): editar o archivar. */
export default function DeckMenu(props: Props) {
  const menu = useDeckMenu(
    () => props.id,
    () => props.onChange(),
  );

  return (
    <>
      <Button
        icon={EllipsisVerticalIcon}
        ref={menu.refs.trigger}
        aria-label={`Acciones de «${props.title}»`}
        aria-haspopup="true"
        aria-expanded={menu.open()}
        onClick={menu.toggle}
      />
      <div
        ref={menu.refs.menu}
        popover
        class={styles.menu}
        on:toggle={menu.onToggle}
      >
        <Show
          when={menu.confirming()}
          fallback={
            <>
              <button
                type="button"
                class={styles.item}
                data-flat
                onClick={menu.edit}
              >
                <PencilIcon class={styles.itemIcon} />
                Editar
              </button>
              <button
                type="button"
                class={`${styles.item} ${styles.danger}`}
                data-flat
                onClick={menu.askArchive}
              >
                <ArchiveIcon class={styles.itemIcon} />
                Archivar
              </button>
            </>
          }
        >
          <p class={styles.confirm}>
            Se oculta de la home. Sus comentarios se conservan.
          </p>
          <div class={styles.row}>
            <button
              type="button"
              class={`${styles.item} ${styles.dangerSolid}`}
              data-flat
              disabled={menu.busy()}
              onClick={() => void menu.archive()}
            >
              Archivar
            </button>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={menu.cancelArchive}
            >
              Cancelar
            </button>
          </div>
        </Show>
      </div>
    </>
  );
}
