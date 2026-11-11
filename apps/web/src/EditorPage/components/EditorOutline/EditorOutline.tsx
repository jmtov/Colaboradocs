import { For } from 'solid-js';
import type { DocumentSection } from '@/content/content.types';
import styles from './EditorOutline.module.css';

type Props = {
  sections: DocumentSection[];
  /** La sección donde está el cursor. */
  currentId: string | undefined;
  onSelect: (id: string) => void;
  /** Cuántas fuentes tiene la bibliografía. */
  sourcesCount: number;
  onSources: () => void;
  /** Cuántos términos tiene el glosario. */
  glossaryCount: number;
  /** Ir al glosario, debajo del editor. */
  onGlossary: () => void;
};

/** Las secciones del documento, tal como van quedando mientras se escribe. */
export default function EditorOutline(props: Props) {
  return (
    <nav aria-label="Secciones del documento">
      <span class={styles.eyebrow}>Documento</span>
      <div class={styles.list}>
        <For each={props.sections}>
          {(section) => (
            <button
              type="button"
              data-flat
              class={styles.link}
              classList={{
                [styles.current ?? '']: section.id === props.currentId,
              }}
              aria-current={section.id === props.currentId ? 'true' : undefined}
              onClick={() => props.onSelect(section.id)}
            >
              <span class={styles.number}>{section.num}</span>
              <span class={styles.title}>{section.title || 'Sin título'}</span>
              <span
                class={styles.status}
                data-status={section.status}
                role="img"
                aria-label={section.status}
                title={section.status}
              />
            </button>
          )}
        </For>
        <button
          type="button"
          data-flat
          class={`${styles.link} ${styles.sources}`}
          aria-label="Glosario"
          onClick={props.onGlossary}
        >
          <span class={styles.number}>{props.glossaryCount}</span>
          <span class={styles.title}>Glosario</span>
        </button>
        <button
          type="button"
          data-flat
          class={styles.link}
          onClick={props.onSources}
        >
          <span class={styles.number}>{props.sourcesCount}</span>
          <span class={styles.title}>Bibliografía</span>
        </button>
      </div>
    </nav>
  );
}
