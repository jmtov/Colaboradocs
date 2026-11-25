import {
  Button,
  MenuConfirm,
  MenuItem,
  MenuPanel,
} from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import EllipsisVerticalIcon from '@/shared/icons/EllipsisVerticalIcon';
import PencilIcon from '@/shared/icons/PencilIcon';
import TrashIcon from '@/shared/icons/TrashIcon';
import { useTaskMenu } from './TaskMenu.hooks';

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
      <MenuPanel
        ref={(element) => {
          menu.refs.menu = element;
        }}
        onToggle={menu.onToggle}
      >
        <Show
          when={menu.confirming()}
          fallback={
            <>
              <Show when={props.onEdit}>
                <MenuItem
                  icon={PencilIcon}
                  label="Editar"
                  description="Cambia el título, la fecha o la persona"
                  onClick={menu.edit}
                />
              </Show>
              <Show when={props.onDelete}>
                <MenuItem
                  icon={TrashIcon}
                  label="Eliminar"
                  danger
                  onClick={menu.askRemove}
                />
              </Show>
            </>
          }
        >
          <MenuConfirm
            message="La tarea se elimina para todas las personas."
            confirmLabel="Eliminar"
            confirmIcon={TrashIcon}
            onConfirm={menu.remove}
            onCancel={menu.cancelRemove}
          />
        </Show>
      </MenuPanel>
    </>
  );
}
