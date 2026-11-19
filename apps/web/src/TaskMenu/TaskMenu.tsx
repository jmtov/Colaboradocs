import { Button } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import EllipsisVerticalIcon from '@/icons/EllipsisVerticalIcon';
import PencilIcon from '@/icons/PencilIcon';
import TrashIcon from '@/icons/TrashIcon';
import { useTaskMenu } from './TaskMenu.hooks';
import styles from './TaskMenu.module.css';

type Props = {
  /** Nombre de la tarea, para la etiqueta del botón. */
  title: string;
  /** Sin esto no hay «Editar». */
  onEdit?: () => void;
  /** Sin esto no hay «Eliminar». */
  onDelete?: () => void;
};

/** Menú de una tarea: editarla o eliminarla (con confirmación). */
export default function TaskMenu(props: Props) {
  const menu = useTaskMenu(() => props);

  return (
    <>
      <Button
        icon={EllipsisVerticalIcon}
        size="sm"
        ref={menu.refs.trigger}
        aria-label={`Acciones de la tarea «${props.title}»`}
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
              <Show when={props.onEdit}>
                <button
                  type="button"
                  class={styles.item}
                  data-flat
                  onClick={menu.edit}
                >
                  <PencilIcon class={styles.itemIcon} />
                  Editar
                </button>
              </Show>
              <Show when={props.onDelete}>
                <button
                  type="button"
                  class={`${styles.item} ${styles.danger}`}
                  data-flat
                  onClick={menu.askRemove}
                >
                  <TrashIcon class={styles.itemIcon} />
                  Eliminar
                </button>
              </Show>
            </>
          }
        >
          <p class={styles.confirm}>
            La tarea se elimina para todas las personas.
          </p>
          <div class={styles.row}>
            <button
              type="button"
              class={`${styles.item} ${styles.dangerSolid}`}
              data-flat
              onClick={menu.remove}
            >
              Eliminar
            </button>
            <button
              type="button"
              class={styles.item}
              data-flat
              onClick={menu.cancelRemove}
            >
              Cancelar
            </button>
          </div>
        </Show>
      </div>
    </>
  );
}
