import { Button } from '@colaboradocs/review-ui';
import type { Component } from 'solid-js';
import styles from './IconButton.module.css';

type Props = {
  /** El nombre del botón para quien no lo ve (lector de pantalla). */
  label: string;
  /** Lo que dice el tooltip al pasar el cursor o enfocar; por defecto, `label`. */
  tooltip?: string;
  /** De qué lado sale el tooltip (abajo por defecto; arriba si el botón está al pie de la pantalla). */
  placement?: 'top' | 'bottom';
  icon: Component<{ class?: string }>;
  /** Para los que se activan y desactivan (negrilla, lista…). */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Un botón solo con ícono y un tooltip. No le quita el foco (ni la selección) al editor.
 * No lleva `data-flat`: se despega y se hunde como todos los botones (ver index.css). Esa
 * animación recorta lo que sale del marco del botón, y por eso el tooltip es un hermano del
 * botón, dentro de un contenedor, y no un pseudo-elemento suyo.
 */
export default function IconButton(props: Props) {
  return (
    <span class={styles.wrap}>
      <Button
        icon={props.icon}
        aria-label={props.label}
        pressed={props.pressed}
        disabled={props.disabled}
        keepFocus
        onClick={props.onClick}
      />
      <span
        class={styles.tip}
        data-placement={props.placement ?? 'bottom'}
        aria-hidden="true"
      >
        {props.tooltip ?? props.label}
      </span>
    </span>
  );
}
