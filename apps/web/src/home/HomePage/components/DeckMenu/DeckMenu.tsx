import {
  Button,
  MenuConfirm,
  MenuItem,
  MenuPanel,
} from '@colaboradocs/review-ui';
import ArchiveIcon from 'lucide-solid/icons/archive';
import EllipsisVerticalIcon from 'lucide-solid/icons/ellipsis-vertical';
import PencilIcon from 'lucide-solid/icons/pencil-line';
import { Show } from 'solid-js';
import { useDeckMenu } from './DeckMenu.hooks';

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
              <MenuItem
                icon={PencilIcon}
                label="Editar"
                description="Abre el editor de la presentación"
                onClick={menu.edit}
              />
              <MenuItem
                icon={ArchiveIcon}
                label="Archivar"
                danger
                onClick={menu.askArchive}
              />
            </>
          }
        >
          <MenuConfirm
            message="Se oculta de la home. Sus comentarios se conservan."
            confirmLabel="Archivar"
            confirmIcon={ArchiveIcon}
            busy={menu.busy()}
            onConfirm={() => void menu.archive()}
            onCancel={menu.cancelArchive}
          />
        </Show>
      </MenuPanel>
    </>
  );
}
