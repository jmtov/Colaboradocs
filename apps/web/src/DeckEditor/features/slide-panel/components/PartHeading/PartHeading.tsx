import styles from './PartHeading.module.css';

/** El título de una de las tres partes del panel (General, Contenido, Otros datos): separa y dice en cuál se está. */
export default function PartHeading(props: { label: string }) {
  return <h2 class={styles.heading}>{props.label}</h2>;
}
