import type { JSX } from 'solid-js';
import styles from './GridMessage.module.css';

/** Un aviso que ocupa toda la fila de la grilla («Todavía no hay…», «Ningún … coincide»). */
export default function GridMessage(props: { children: JSX.Element }) {
  return <li class={styles.message}>{props.children}</li>;
}
