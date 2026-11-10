import { For, Show } from 'solid-js';
import type { DocumentSection } from '@/content/content.types';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import styles from './SectionCards.module.css';

type Props = {
  sections: DocumentSection[];
  pending: Record<string, number>;
  onGo: (sectionId: string) => void;
};

function pendingLabel(count: number): string {
  return `${count} ${count === 1 ? 'pendiente' : 'pendientes'}`;
}

export default function SectionCards(props: Props) {
  return (
    <section class={styles.contents} aria-labelledby="contents-title">
      <h2 id="contents-title" class={styles.heading}>
        Contenido del documento
      </h2>
      <div class={styles.cards}>
        <For each={props.sections}>
          {(section) => (
            <button
              type="button"
              class={styles.card}
              onClick={() => props.onGo(section.id)}
            >
              <span class={styles.top}>
                <span class={styles.number}>
                  {section.num.padStart(2, '0')}
                </span>
                <ArrowRightIcon class={styles.icon} />
              </span>
              <span class={styles.title}>{section.title}</span>
              <span class={styles.description}>{section.description}</span>
              <span class={styles.footer}>
                <Show when={props.pending[section.id]}>
                  {(count) => (
                    <span class={styles.pending}>{pendingLabel(count())}</span>
                  )}
                </Show>
              </span>
            </button>
          )}
        </For>
      </div>
    </section>
  );
}
