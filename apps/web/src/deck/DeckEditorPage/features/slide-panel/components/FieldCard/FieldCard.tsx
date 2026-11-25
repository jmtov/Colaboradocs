import type { JSX } from 'solid-js';
import styles from './FieldCard.module.css';

/** Filas apiladas en una tarjeta: la línea entre ellas es el 1px de `gap`, donde se ve el fondo del contenedor. */
export default function FieldCard(props: { children: JSX.Element }) {
  return <div class={styles.card}>{props.children}</div>;
}
