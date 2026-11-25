import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './FieldGroup.module.css';

type GroupProps = {
  /** Rótulo del grupo, en mayúsculas pequeñas arriba de la caja. */
  title: string;
  /** Una línea que explica el grupo, debajo de la caja. */
  hint?: string;
  children: JSX.Element;
};

/** Un grupo de filas «etiqueta … valor» dentro de una caja con líneas finas. */
export function FieldGroup(props: GroupProps) {
  return (
    <div class={styles.group}>
      <h2 class={styles.title}>{props.title}</h2>
      <div class={styles.box}>{props.children}</div>
      <Show when={props.hint}>
        <p class={styles.hint}>{props.hint}</p>
      </Show>
    </div>
  );
}

type RowProps = {
  label: string;
  /** El campo (normalmente un `<input>` con `class={fieldStyles.input}`) y lo que lo acompañe. */
  children: JSX.Element;
};

/** Una fila del grupo: tocar la etiqueta lleva al campo. */
export function FieldRow(props: RowProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: el campo llega como `children`
    <label class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      {props.children}
    </label>
  );
}

/** Un rótulo suelto, con el mismo aspecto que el de un grupo (para lo que no son filas). */
export function FieldTitle(props: { children: string }) {
  return <h3 class={styles.title}>{props.children}</h3>;
}
