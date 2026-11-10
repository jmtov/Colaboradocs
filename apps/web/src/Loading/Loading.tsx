import type { JSX } from 'solid-js';
import styles from './Loading.module.css';

/** Página con un mensaje centrado: cargando, error o «no existe». */
export default function Loading(props: { children: JSX.Element }) {
  return (
    <main class={styles.page} role="status">
      {props.children}
    </main>
  );
}
