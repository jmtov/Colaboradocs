import type { ReviewComment, Thread } from '@colaboradocs/review-core';
import { createSignal, For, Show } from 'solid-js';
import Button from '../../../Button/Button';
import CircleCheckIcon from '../../../icons/CircleCheckIcon';
import ReplyIcon from '../../../icons/ReplyIcon';
import RotateCcwIcon from '../../../icons/RotateCcwIcon';
import TrashIcon from '../../../icons/TrashIcon';
import { useReview } from '../../../ReviewProvider/review.context';
import { formatRelativeTime } from '../../../time/time.utils';
import CommentComposer from '../CommentComposer/CommentComposer';
import styles from './ThreadView.module.css';

type Props = {
  thread: Thread;
  /** Extracto del bloque, para guardarlo junto a cada respuesta. */
  excerpt: string;
};

export default function ThreadView(props: Props) {
  const review = useReview();
  const [replying, setReplying] = createSignal(false);

  const me = () => review.snapshot()?.me;
  const isMine = (comment: ReviewComment) => comment.authorId === me()?.id;
  const canModerate = (comment: ReviewComment) =>
    isMine(comment) || me()?.isAdmin === true;
  const root = () => props.thread.root;

  async function sendReply(text: string) {
    const saved = await review.addComment({
      blockId: root().blockId,
      parentId: root().id,
      text,
      blockExcerpt: props.excerpt,
    });
    if (saved) setReplying(false);
    return saved;
  }

  function renderComment(comment: ReviewComment, isReply: boolean) {
    return (
      <article class={styles.comment} classList={{ [styles.reply]: isReply }}>
        <div class={styles.meta}>
          <span class={styles.author}>{comment.authorName}</span>
          <Show when={comment.authorMunicipality}>
            <span class={styles.municipality}>
              {comment.authorMunicipality}
            </span>
          </Show>
          <span class={styles.time}>
            {formatRelativeTime(comment.createdAt, Date.now())}
          </span>
          <Show when={comment.text !== null && canModerate(comment)}>
            <Button
              icon={TrashIcon}
              variant="danger"
              size="sm"
              onClick={() => review.deleteComment(comment.id)}
            >
              Eliminar
            </Button>
          </Show>
        </div>
        <Show
          when={comment.text}
          fallback={
            <p class={`${styles.text} ${styles.deleted}`}>
              Comentario eliminado
            </p>
          }
        >
          {(text) => <p class={styles.text}>{text()}</p>}
        </Show>
      </article>
    );
  }

  return (
    <section
      class={styles.thread}
      classList={{ [styles.resolved]: root().resolved }}
    >
      <Show when={root().resolved}>
        <span class={styles.badge}>Resuelto</span>
      </Show>
      {renderComment(root(), false)}
      <For each={props.thread.replies}>
        {(reply) => renderComment(reply, true)}
      </For>
      <Show
        when={replying()}
        fallback={
          <div class={styles.actions}>
            <Button
              icon={ReplyIcon}
              size="sm"
              onClick={() => setReplying(true)}
            >
              Responder
            </Button>
            <Show when={canModerate(root())}>
              <Button
                icon={root().resolved ? RotateCcwIcon : CircleCheckIcon}
                size="sm"
                onClick={() => review.setResolved(root().id, !root().resolved)}
              >
                {root().resolved ? 'Reabrir' : 'Marcar resuelto'}
              </Button>
            </Show>
          </div>
        }
      >
        <CommentComposer
          placeholder="Escribe tu respuesta"
          submitLabel="Responder"
          onSubmit={sendReply}
          onCancel={() => setReplying(false)}
        />
      </Show>
    </section>
  );
}
