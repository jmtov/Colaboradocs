import {
  Button,
  MenuConfirm,
  MenuItem,
  MenuPanel,
} from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import ArchiveIcon from '@/shared/icons/ArchiveIcon';
import EllipsisVerticalIcon from '@/shared/icons/EllipsisVerticalIcon';
import PencilIcon from '@/shared/icons/PencilIcon';
import UploadIcon from '@/shared/icons/UploadIcon';
import { useDocumentMenu } from './DocumentMenu.hooks';

type Props = {
  id: string;
  title: string;
};

/** Menú de un documento (solo admins): editarlo, reemplazar el archivo o archivarlo. */
export default function DocumentMenu(props: Props) {
  const documentMenu = useDocumentMenu(() => props.id);

  return (
    <>
      <Button
        icon={EllipsisVerticalIcon}
        ref={documentMenu.refs.trigger}
        aria-label={`Acciones de «${props.title}»`}
        aria-haspopup="true"
        aria-expanded={documentMenu.open()}
        onClick={documentMenu.toggle}
      />
      <MenuPanel
        ref={(element) => {
          documentMenu.refs.menu = element;
        }}
        onToggle={documentMenu.onToggle}
      >
        <Show
          when={documentMenu.confirming()}
          fallback={
            <>
              <MenuItem
                icon={PencilIcon}
                label="Editar"
                description="Abre el editor con el borrador"
                onClick={documentMenu.edit}
              />
              <MenuItem
                icon={UploadIcon}
                label="Reemplazar documento"
                description="Sube otro archivo con el mismo id"
                onClick={documentMenu.replace}
              />
              <MenuItem
                icon={ArchiveIcon}
                label="Archivar"
                danger
                onClick={documentMenu.askArchive}
              />
            </>
          }
        >
          <MenuConfirm
            message="Se oculta de la home. Sus comentarios se conservan y reaparecen si lo vuelves a subir."
            confirmLabel="Archivar"
            confirmIcon={ArchiveIcon}
            busy={documentMenu.busy()}
            onConfirm={() => void documentMenu.archive()}
            onCancel={documentMenu.cancelArchive}
          />
        </Show>
      </MenuPanel>
    </>
  );
}
