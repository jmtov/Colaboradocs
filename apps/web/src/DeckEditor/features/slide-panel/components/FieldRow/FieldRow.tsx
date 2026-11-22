import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './FieldRow.module.css';

interface FieldRowProps {
  label: string;
  required?: boolean;
  help?: string;
  /** El control ocupa varias líneas (texto largo): la etiqueta queda arriba. */
  tall?: boolean;
  children: JSX.Element;
}

/** Una fila de formulario: la etiqueta a la izquierda y el valor a la derecha. */
export default function FieldRow(props: FieldRowProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: el control llega como children
    <label
      class={styles.row}
      classList={{ [styles.tall as string]: props.tall }}
    >
      <span class={styles.label}>
        {props.label}
        <Show when={props.required}>
          <span class={styles.required}> *</span>
        </Show>
      </span>
      <span class={styles.value}>{props.children}</span>
      <Show when={props.help}>
        <span class={styles.help}>{props.help}</span>
      </Show>
    </label>
  );
}
