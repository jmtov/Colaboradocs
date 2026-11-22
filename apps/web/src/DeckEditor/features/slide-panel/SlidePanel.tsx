import {
  PART_LABELS,
  partsOf,
  SLIDE_DESCRIPTORS,
} from '@colaboradocs/deck-core';
import { For, Show } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import { issuesOfSlide } from '@/DeckEditor/features/deck/deck.utils';
import { slideSummary } from '@/DeckEditor/features/slide-list/SlideList.utils';
import FieldForm from './components/FieldForm/FieldForm';
import FieldSection from './components/FieldSection/FieldSection';
import PartHeading from './components/PartHeading/PartHeading';
import TestCaseMenu from './components/TestCaseMenu/TestCaseMenu';
import styles from './SlidePanel.module.css';

export default function SlidePanel() {
  const index = () => deckStore.slideIndex();
  const slide = () => deckStore.deck.slides[index()];
  return (
    <Show when={slide()} fallback={<p class={styles.empty}>No hay slides.</p>}>
      {(current) => (
        <div class={styles.panel}>
          <header class={styles.head}>
            <div class={styles.titles}>
              <h1 class={styles.title}>
                Diapositiva {String(index() + 1).padStart(2, '0')}
              </h1>
              <p class={styles.kind}>
                Cuadrícula: <strong>{slideSummary(current())}</strong>
              </p>
            </div>
            <TestCaseMenu />
          </header>

          <Show when={issuesOfSlide(deckStore.issues(), index()).length > 0}>
            <FieldSection title="Problemas de esta slide">
              <ul class={styles.issues}>
                <For each={issuesOfSlide(deckStore.issues(), index())}>
                  {(issue) => (
                    <li>
                      <code>{issue.path}</code> {issue.message}
                    </li>
                  )}
                </For>
              </ul>
            </FieldSection>
          </Show>

          <For each={partsOf(SLIDE_DESCRIPTORS[current().kind].fields)}>
            {(part) => (
              <section class={styles.part}>
                <PartHeading label={PART_LABELS[part.part]} />
                <FieldForm
                  fields={part.fields}
                  value={current() as unknown as Record<string, unknown>}
                  path={['slides', index()]}
                />
              </section>
            )}
          </For>
        </div>
      )}
    </Show>
  );
}
