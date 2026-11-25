import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import styles from './CardStat.module.css';

type Props = {
  icon: Component<{ class?: string }>;
  count: number;
  /** Lo que significa el número, para quien no ve el ícono: «2 hilos abiertos». */
  label: string;
  /** Resalta el número (hay algo pendiente). */
  highlight?: boolean;
};

/** Un número con su ícono en el pie de una tarjeta. */
export default function CardStat(props: Props) {
  return (
    <span
      class={styles.stat}
      classList={{ [styles.highlight]: props.highlight }}
      role="img"
      aria-label={props.label}
      title={props.label}
    >
      <Dynamic component={props.icon} class={styles.icon} />
      {props.count}
    </span>
  );
}
