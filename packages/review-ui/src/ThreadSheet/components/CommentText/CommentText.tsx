import { splitMentions } from '@colaboradocs/review-core';
import { createMemo, createSignal, For, Show } from 'solid-js';
import PersonCard from '../../../PersonCard/PersonCard';
import { useReview } from '../../../ReviewProvider/review.context';
import styles from './CommentText.module.css';

type Props = {
  text: string;
};

/** Texto de un comentario; las «@personas» se tocan y abren su tarjeta. */
export default function CommentText(props: Props) {
  const review = useReview();
  const [openName, setOpenName] = createSignal<string | null>(null);
  const segments = createMemo(() =>
    splitMentions(
      props.text,
      Object.values(review.snapshot()?.reviewers ?? {}),
    ),
  );
  const opened = createMemo(() => {
    const name = openName();
    if (name === null) return undefined;
    return Object.values(review.snapshot()?.reviewers ?? {}).find(
      (person) => person.name.toLowerCase() === name,
    );
  });

  return (
    <>
      <p class={styles.text}>
        <For each={segments()}>
          {(segment) =>
            segment.kind === 'mention' ? (
              <button
                type="button"
                class={styles.mention}
                aria-expanded={openName() === segment.person.name.toLowerCase()}
                onClick={() => {
                  const name = segment.person.name.toLowerCase();
                  setOpenName(openName() === name ? null : name);
                }}
              >
                {segment.text}
              </button>
            ) : (
              segment.text
            )
          }
        </For>
      </p>
      <Show when={opened()}>
        {(person) => (
          <PersonCard
            name={person().name}
            municipality={person().municipality}
          />
        )}
      </Show>
    </>
  );
}
