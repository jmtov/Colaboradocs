import type { Editor } from '@tiptap/core';
import AtSignIcon from 'lucide-solid/icons/at-sign';
import LinkIcon from 'lucide-solid/icons/link';
import QuoteIcon from 'lucide-solid/icons/quote';
import RedoIcon from 'lucide-solid/icons/redo-2';
import UndoIcon from 'lucide-solid/icons/undo-2';
import { For, Show } from 'solid-js';
import IconButton from '@/shared/ui/IconButton/IconButton';
import CompactActions from './components/CompactActions/CompactActions';
import {
  FORMAT_GROUPS,
  MARK_ITEMS,
  type ToolbarItem,
} from './EditorToolbar.constants';
import { useEditorToolbar } from './EditorToolbar.hooks';
import styles from './EditorToolbar.module.css';

type Props = {
  /** El editor del documento; sin él (todavía cargando) los botones no hacen nada. */
  editor: Editor | undefined;
  /** Insertar una cita de la bibliografía en el cursor; sin esto no hay botón de cita. */
  onCite?: () => void;
  /** Poner o editar un enlace en el texto; sin esto no hay botón de enlace. */
  onLink?: () => void;
  /** Mencionar a una persona del espacio; sin esto no hay botón de mención. */
  onMention?: () => void;
};

/** Formato del documento: solo lo que el documento admite. Solo íconos; el nombre sale en el tooltip. */
export default function EditorToolbar(props: Props) {
  const toolbar = useEditorToolbar(() => props.editor);

  /** Activo donde está el cursor; sin `undefined` para los que no se encienden. */
  const pressedOf = (item: ToolbarItem) => {
    if (item.active) return toolbar.matches(item.active);
    return item.name ? toolbar.isActive(item.name, item.attrs) : undefined;
  };

  const itemButton = (item: ToolbarItem) => (
    <IconButton
      label={item.label}
      tooltip={item.title}
      icon={item.icon}
      pressed={pressedOf(item)}
      disabled={!props.editor}
      onClick={() => toolbar.press(item)}
    />
  );

  return (
    <div class={styles.bar} role="toolbar" aria-label="Formato">
      <div class={styles.group}>
        <IconButton
          label="Deshacer"
          icon={UndoIcon}
          disabled={!toolbar.can('undo')}
          onClick={() => toolbar.run((chain) => chain.undo())}
        />
        <IconButton
          label="Rehacer"
          icon={RedoIcon}
          disabled={!toolbar.can('redo')}
          onClick={() => toolbar.run((chain) => chain.redo())}
        />
      </div>
      <div class={styles.group}>
        <For each={MARK_ITEMS}>{itemButton}</For>
      </div>
      <For each={FORMAT_GROUPS}>
        {(group, index) => (
          <div class={`${styles.group} ${styles.wide}`}>
            <For each={group}>{itemButton}</For>
            <Show when={index() === FORMAT_GROUPS.length - 1 && props.onLink}>
              {(link) => (
                <IconButton
                  label="Enlace"
                  tooltip="Enlace: lleva a una página, un correo o un documento"
                  icon={LinkIcon}
                  pressed={toolbar.isActive('link')}
                  disabled={!props.editor}
                  onClick={link()}
                />
              )}
            </Show>
            <Show
              when={index() === FORMAT_GROUPS.length - 1 && props.onMention}
            >
              {(mention) => (
                <IconButton
                  label="Mencionar"
                  tooltip="Mencionar: una persona del espacio; al tocarla se ve su tarjeta"
                  icon={AtSignIcon}
                  disabled={!props.editor}
                  onClick={mention()}
                />
              )}
            </Show>
            <Show when={index() === FORMAT_GROUPS.length - 1 && props.onCite}>
              {(cite) => (
                <IconButton
                  label="Cita"
                  tooltip="Cita: agrega una referencia de la bibliografía en el cursor"
                  icon={QuoteIcon}
                  pressed={toolbar.isActive('citation')}
                  disabled={!props.editor}
                  onClick={cite()}
                />
              )}
            </Show>
          </div>
        )}
      </For>
      <CompactActions
        class={styles.compact}
        editor={props.editor}
        current={toolbar.style()}
        onLink={props.onLink}
        onMention={props.onMention}
        onCite={props.onCite}
      />
    </div>
  );
}
