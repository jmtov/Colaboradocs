import { ActionMenu, Button, useOverlay } from '@colaboradocs/review-ui';
import ArrowDownIcon from 'lucide-solid/icons/arrow-down';
import ArrowLeftIcon from 'lucide-solid/icons/arrow-left';
import GridIcon from 'lucide-solid/icons/grid-3x3';
import RedoIcon from 'lucide-solid/icons/redo-2';
import SlidersIcon from 'lucide-solid/icons/sliders-horizontal';
import TrashIcon from 'lucide-solid/icons/trash';
import UndoIcon from 'lucide-solid/icons/undo-2';
import UploadIcon from 'lucide-solid/icons/upload';
import { Show } from 'solid-js';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import { viewStore } from '@/deck/DeckEditorPage/features/preview/view.store';
import type { EditorActions } from '../../DeckEditorPage.hooks';
import DeckSettingsSheet from './components/DeckSettingsSheet/DeckSettingsSheet';
import { useDeckFiles } from './Toolbar.hooks';
import styles from './Toolbar.module.css';

type Props = { actions: EditorActions };

const SAVE_LABELS = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Borrador guardado',
  error: 'No se pudo guardar',
} as const;

export default function Toolbar(props: Props) {
  const files = useDeckFiles();
  const overlay = useOverlay();
  return (
    <div class={styles.bar}>
      <Button
        icon={ArrowLeftIcon}
        size="sm"
        title="Salir del editor y volver a la presentación, en esta slide"
        onClick={props.actions.view}
      >
        Volver a la presentación
      </Button>
      <strong class={styles.title}>{deckStore.deck.title}</strong>
      <span class={styles.spacer} />
      <Show when={deckStore.issues().length > 0}>
        <span
          class={styles.issues}
          title={deckStore
            .issues()
            .map((i) => `${i.path}: ${i.message}`)
            .join('\n')}
        >
          {deckStore.issues().length}{' '}
          {deckStore.issues().length === 1 ? 'problema' : 'problemas'}
        </span>
      </Show>
      <span class={styles.message} role="status">
        {props.actions.error() ?? SAVE_LABELS[props.actions.saveState()]}
      </span>
      <Button
        icon={UndoIcon}
        size="sm"
        disabled={deckStore.history().past.length === 0}
        title="Deshacer (Cmd+Z)"
        onClick={() => deckStore.undo()}
      >
        Deshacer
      </Button>
      <Button
        icon={RedoIcon}
        size="sm"
        disabled={deckStore.history().future.length === 0}
        title="Rehacer (Cmd+Mayús+Z)"
        onClick={() => deckStore.redo()}
      >
        Rehacer
      </Button>
      <ActionMenu
        size="sm"
        label="Opciones"
        triggerLabel="Opciones"
        groups={[
          {
            items: [
              {
                label: 'Configuración de la presentación',
                description: 'Tema y variante',
                icon: SlidersIcon,
                onSelect: () => void overlay.sheet(DeckSettingsSheet, {}),
              },
            ],
          },
          {
            title: 'Vista',
            items: [
              {
                label: 'Ver celdas',
                description:
                  'Dibuja columnas, filas y celdas en la vista previa',
                icon: GridIcon,
                checked: viewStore.showCells(),
                onSelect: () => viewStore.toggleCells(),
              },
            ],
          },
          {
            title: 'Archivo',
            items: [
              {
                label: 'Importar JSON…',
                icon: UploadIcon,
                onSelect: () => files.importInput()?.click(),
              },
              {
                label: 'Exportar JSON',
                icon: ArrowDownIcon,
                onSelect: files.exportDeck,
              },
            ],
          },
          {
            items: [
              {
                label: 'Descartar cambios',
                description: 'Vuelve a lo último publicado',
                icon: TrashIcon,
                danger: true,
                onSelect: props.actions.discard,
              },
            ],
          },
        ]}
      />
      <Button
        icon={UploadIcon}
        size="sm"
        variant="primary"
        disabled={props.actions.publishing()}
        onClick={props.actions.publish}
      >
        Publicar
      </Button>
      <input
        ref={files.setImportInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={files.onImport}
      />
      <Show when={files.message()}>
        {(text) => <span class={styles.message}>{text()}</span>}
      </Show>
    </div>
  );
}
