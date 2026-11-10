import type { DocumentSection } from '@/content/content.types';
import Prose from '@/Prose/Prose';
import styles from './SectionView.module.css';

export default function SectionView(props: {
  section: DocumentSection;
  glossaryTerms?: Record<string, string>;
}) {
  return (
    <section
      id={`sec-${props.section.id}`}
      class={styles.section}
      data-section-id={props.section.id}
      data-section-label={`${props.section.num}. ${props.section.title}`}
    >
      <div class={styles.header}>
        <span class={styles.number}>{props.section.num.padStart(2, '0')}</span>
        <h2 class={styles.title}>{props.section.title}</h2>
      </div>
      <Prose
        section={props.section}
        glossaryTerms={props.glossaryTerms}
        reviewable
      />
    </section>
  );
}
