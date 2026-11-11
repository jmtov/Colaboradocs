import { excerptOf, groupThreads } from '@juntanza/review-core';
import { createMemo, For, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import { useReview } from '../ReviewProvider/review.context';
import CommentComposer from './components/CommentComposer/CommentComposer';
import ThreadView from './components/ThreadView/ThreadView';
import styles from './ThreadSheet.module.css';

type Props = {
  open: boolean;
  blockId: string;
  /** Texto completo del bloque; se muestra recortado y se guarda como extracto. */
  blockText: string;
  onClose: () => void;
};

export default function ThreadSheet(props: Props) {
  const review = useReview();
  const threads = createMemo(
    () =>
      groupThreads(review.snapshot()?.comments ?? []).get(props.blockId) ?? [],
  );
  const excerpt = () => excerptOf(props.blockText);

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
          each={threads()}
          fallback={
            <p class={styles.empty}>Todavía no hay comentarios aquí.</p>
          }
        >
          {(thread) => <ThreadView thread={thread} excerpt={excerpt()} />}
        </For>
      </div>
      <span class={styles.label}>
        <Show when={threads().length > 0} fallback="Primer comentario">
          Nuevo comentario
        </Show>
      </span>
      <CommentComposer
        placeholder="Escribe un comentario sobre este párrafo"
        submitLabel="Comentar"
        onSubmit={(text) =>
          review.addComment({
            blockId: props.blockId,
            parentId: null,
            text,
            blockExcerpt: excerpt(),
          })
        }
      />
    </BottomSheet>
  );
}
