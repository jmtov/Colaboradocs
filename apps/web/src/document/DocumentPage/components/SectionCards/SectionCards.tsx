import type { DocumentSection } from '@colaboradocs/review-core';
import ArrowRightIcon from 'lucide-solid/icons/arrow-right';
import { For, Show } from 'solid-js';
import CollapsibleSection from '@/document/DocumentPage/components/CollapsibleSection/CollapsibleSection';
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
    <CollapsibleSection
      id="contents-title"
      title="Contenido del documento"
      defaultOpen={false}
      note={`(${props.sections.length} ${props.sections.length === 1 ? 'sección' : 'secciones'})`}
      class={styles.contents}
    >
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
              <Show when={section.description}>
                <span class={styles.description}>{section.description}</span>
              </Show>
              <Show when={props.pending[section.id]}>
                {(count) => (
                  <span class={styles.footer}>
                    <span class={styles.pending}>{pendingLabel(count())}</span>
                  </span>
                )}
              </Show>
            </button>
          )}
        </For>
      </div>
    </CollapsibleSection>
  );
}
