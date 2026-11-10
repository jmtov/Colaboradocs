import { For } from 'solid-js';
import type { DocumentSection } from '@/content/content.types';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import styles from './SideNav.module.css';

type Props = {
  sections: DocumentSection[];
  currentId: string;
  onGo: (sectionId: string) => void;
};

export default function SideNav(props: Props) {
  return (
    <aside class={styles.side}>
      <span class={styles.eyebrow}>Documento</span>
      <nav class={styles.nav}>
        <For each={props.sections}>
          {(section) => (
            <button
              type="button"
              class={styles.link}
              classList={{ [styles.current]: props.currentId === section.id }}
              onClick={() => props.onGo(section.id)}
            >
              <span class={styles.number}>{section.num}</span>
              {section.title}
              <ArrowRightIcon class={styles.icon} />
            </button>
          )}
        </For>
      </nav>
    </aside>
  );
}
