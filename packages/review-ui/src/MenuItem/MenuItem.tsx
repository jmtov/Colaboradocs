import { type Component, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import styles from './MenuItem.module.css';

type Props = {
  label: string;
  /** Una línea que explica qué hace, debajo de la etiqueta. */
  description?: string;
  icon?: Component<{ class?: string }>;
  /** Acción destructiva: va en rojo. */
  danger?: boolean;
  disabled?: boolean;
  /** La opción activa (se marca con un visto): sirve para opciones que se encienden y se apagan. */
  checked?: boolean;
  onClick: () => void;
};

/** Una opción de un menú: ícono, texto, una descripción si hace falta y, si es una opción activa, un visto. */
export default function MenuItem(props: Props) {
  return (
    <button
      type="button"
      class={styles.item}
      classList={{ [styles.danger]: props.danger }}
      data-flat
      disabled={props.disabled}
      onClick={() => props.onClick()}
    >
      <Show when={props.icon}>
        {(icon) => <Dynamic component={icon()} class={styles.icon} />}
      </Show>
      <span class={styles.text}>
        {props.label}
        <Show when={props.description}>
          <small class={styles.description}>{props.description}</small>
        </Show>
      </span>
      <Show when={props.checked !== undefined}>
        <span class={styles.check}>
          <Show when={props.checked}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              data-check
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </Show>
        </span>
      </Show>
    </button>
  );
}
