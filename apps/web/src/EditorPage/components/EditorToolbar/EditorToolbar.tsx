import type { Editor } from '@tiptap/core';
import { For, Show } from 'solid-js';
import IconButton from '@/IconButton/IconButton';
import QuoteIcon from '@/icons/QuoteIcon';
import RedoIcon from '@/icons/RedoIcon';
import UndoIcon from '@/icons/UndoIcon';
import {
  ITEMS_BY_VARIANT,
  type ToolbarItem,
  type ToolbarVariant,
} from './EditorToolbar.constants';
import { useEditorToolbar } from './EditorToolbar.hooks';
import styles from './EditorToolbar.module.css';

type Props = {
  /** El editor del documento; sin él (todavía cargando) los botones no hacen nada. */
  editor: Editor | undefined;
  /** Qué botones lleva: los de siempre (por defecto) o, en la sección glosario, también los de términos. */
  variant?: ToolbarVariant;
  /** Insertar una cita de la bibliografía en el cursor; sin esto no hay botón de cita. */
  onCite?: () => void;
};

/** Formato del documento: solo lo que el documento admite. Solo íconos; el nombre sale en el tooltip. */
export default function EditorToolbar(props: Props) {
  const toolbar = useEditorToolbar(() => props.editor);

  /** Activo donde está el cursor; sin `undefined` para los que no se encienden. */
  const pressedOf = (item: ToolbarItem) => {
    if (item.active) return toolbar.matches(item.active);
    return item.name ? toolbar.isActive(item.name, item.attrs) : undefined;
  };

  return (
    <div class={styles.bar} role="toolbar" aria-label="Formato">
      <For each={ITEMS_BY_VARIANT[props.variant ?? 'section']}>
        {(item) => (
          <IconButton
            label={item.label}
            tooltip={item.title}
            placement="top"
            icon={item.icon}
            pressed={pressedOf(item)}
            disabled={!props.editor}
            onClick={() => toolbar.press(item)}
          />
        )}
      </For>
      <Show when={props.onCite}>
        {(cite) => (
          <IconButton
            label="Cita"
            tooltip="Cita: agrega una referencia de la bibliografía en el cursor"
            placement="top"
            icon={QuoteIcon}
            pressed={toolbar.isActive('citation')}
            disabled={!props.editor}
            onClick={cite()}
          />
        )}
      </Show>
      <span class={styles.gap} />
      <IconButton
        label="Deshacer"
        placement="top"
        icon={UndoIcon}
        disabled={!toolbar.can('undo')}
        onClick={() => toolbar.run((chain) => chain.undo())}
      />
      <IconButton
        label="Rehacer"
        placement="top"
        icon={RedoIcon}
        disabled={!toolbar.can('redo')}
        onClick={() => toolbar.run((chain) => chain.redo())}
      />
    </div>
  );
}
