import type { JSX } from 'solid-js';
import styles from './MenuPanel.module.css';

type Props = {
  /** La ref del elemento: el hook del menú la usa para abrirlo y cerrarlo. */
  ref?: (element: HTMLDivElement) => void;
  onToggle?: (event: ToggleEvent) => void;
  /** Más ancho, para menús con descripciones largas. */
  wide?: boolean;
  children: JSX.Element;
};

/** La caja de un menú: popover nativo (capa superior, Esc, tocar fuera). Todos los menús de la app van en una. */
export default function MenuPanel(props: Props) {
  return (
    <div
      ref={props.ref}
      popover
      class={styles.menu}
      classList={{ [styles.wide]: props.wide }}
      on:toggle={(event) => props.onToggle?.(event)}
    >
      {props.children}
    </div>
  );
}
