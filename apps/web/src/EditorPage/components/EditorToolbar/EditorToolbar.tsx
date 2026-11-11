import type { Editor } from '@tiptap/core';
import { For } from 'solid-js';
import {
  ITEMS_BY_VARIANT,
  type ToolbarVariant,
} from './EditorToolbar.constants';
import { useEditorToolbar } from './EditorToolbar.hooks';
import styles from './EditorToolbar.module.css';

type Props = {
  /** El editor de la sección; sin él (todavía cargando) los botones no hacen nada. */
  editor: Editor | undefined;
  /** Qué botones lleva: el cuerpo de una sección (por defecto), la nota o el glosario. */
  variant?: ToolbarVariant;
};

/** Formato de una sección: solo lo que el documento admite. */
export default function EditorToolbar(props: Props) {
  const toolbar = useEditorToolbar(() => props.editor);

  return (
    <div class={styles.bar} role="toolbar" aria-label="Formato">
      <For each={ITEMS_BY_VARIANT[props.variant ?? 'section']}>
        {(item) => (
          <button
            type="button"
            class={styles.button}
            data-flat
            title={item.title}
            aria-pressed={
              item.name ? toolbar.isActive(item.name, item.attrs) : undefined
            }
            disabled={!props.editor}
            // mousedown: el clic no le quita el foco (y la selección) al editor
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => toolbar.press(item)}
          >
            {item.label}
          </button>
        )}
      </For>
      <span class={styles.gap} />
      <button
        type="button"
        class={styles.button}
        data-flat
        title="Deshacer"
        aria-label="Deshacer"
        disabled={!toolbar.can('undo')}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => toolbar.run((chain) => chain.undo())}
      >
        ↶
      </button>
      <button
        type="button"
        class={styles.button}
        data-flat
        title="Rehacer"
        aria-label="Rehacer"
        disabled={!toolbar.can('redo')}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => toolbar.run((chain) => chain.redo())}
      >
        ↷
      </button>
    </div>
  );
}
