import ArrowRightIcon from 'lucide-solid/icons/arrow-right';
import { For } from 'solid-js';
import CollapsibleSection from '@/document/DocumentPage/components/CollapsibleSection/CollapsibleSection';
import styles from './PeopleCards.module.css';

export type PersonCard = { name: string; municipality: string | null };

type Props = {
  /** «Responsable», «Participantes». */
  title: string;
  people: PersonCard[];
  /** Abrir la tarjeta de la persona. */
  onOpen: (name: string) => void;
};

/** Las personas de un documento (quién responde, quién estuvo) como bloques; tocar uno abre su tarjeta. */
export default function PeopleCards(props: Props) {
  return (
    <CollapsibleSection
      id={`people-${props.title}`}
      title={props.title}
      note={`(${props.people.length})`}
      defaultOpen={false}
      class={styles.people}
    >
      <div class={styles.cards}>
        <For each={props.people}>
          {(person) => (
            <button
              type="button"
              class={styles.card}
              onClick={() => props.onOpen(person.name)}
            >
              <span class={styles.name}>{person.name}</span>
              <span class={styles.municipality}>{person.municipality}</span>
              <ArrowRightIcon class={styles.icon} />
            </button>
          )}
        </For>
      </div>
    </CollapsibleSection>
  );
}
