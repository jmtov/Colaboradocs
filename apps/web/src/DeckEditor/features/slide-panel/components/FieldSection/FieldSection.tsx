import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './FieldSection.module.css';

interface FieldSectionProps {
  title?: string;
  /** Botones a la derecha del título (agregar, quitar). */
  actions?: JSX.Element;
  children: JSX.Element;
}

/** Un bloque de campos con su título, separado de los demás. */
export default function FieldSection(props: FieldSectionProps) {
  return (
    <section class={styles.section}>
      <Show when={props.title || props.actions}>
        <div class={styles.head}>
          <h3 class={styles.title}>{props.title}</h3>
          {props.actions}
        </div>
      </Show>
      {props.children}
    </section>
  );
}
