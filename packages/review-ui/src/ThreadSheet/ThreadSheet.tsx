import { For, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import CommentComposer from './components/CommentComposer/CommentComposer';
import ThreadView from './components/ThreadView/ThreadView';
import { useThreadSheet } from './ThreadSheet.hooks';
import styles from './ThreadSheet.module.css';

type Props = {
  open: boolean;
  blockId: string;
  /** Texto completo del bloque; se muestra recortado y se guarda como extracto. */
  blockText: string;
  onClose: () => void;
};

export default function ThreadSheet(props: Props) {
  const sheet = useThreadSheet({
    blockId: () => props.blockId,
    blockText: () => props.blockText,
  });

  return (
    <BottomSheet
      open={props.open}
      kicker="Comentarios"
      title="Sobre este párrafo"
      compact
      onClose={props.onClose}
    >
      <blockquote class={styles.paragraph}>{props.blockText}</blockquote>
      <div class={styles.list}>
        <For
          each={sheet.threads()}
          fallback={
            <p class={styles.empty}>Todavía no hay comentarios aquí.</p>
          }
        >
          {(thread) => <ThreadView thread={thread} excerpt={sheet.excerpt()} />}
        </For>
      </div>
      <span class={styles.label}>
        <Show when={sheet.threads().length > 0} fallback="Primer comentario">
          Nuevo comentario
        </Show>
      </span>
      <CommentComposer
        placeholder="Escribe un comentario sobre este párrafo"
        submitLabel="Comentar"
        onSubmit={sheet.submitComment}
      />
    </BottomSheet>
  );
}
