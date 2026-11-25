import type { JSX } from 'solid-js';
import styles from './CardGrid.module.css';

/** La grilla de tarjetas de la home: tres columnas, dos en pantallas medianas y una en el celular. */
export default function CardGrid(props: { children: JSX.Element }) {
  return <ul class={styles.grid}>{props.children}</ul>;
}
