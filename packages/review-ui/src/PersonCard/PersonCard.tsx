import { Show } from 'solid-js';
import styles from './PersonCard.module.css';

type Props = {
  name: string;
  /** Municipio (o rol) de la persona; null si no se registró. */
  municipality: string | null;
};

/** Tarjeta de una persona: su nombre y su municipio. */
export default function PersonCard(props: Props) {
  return (
    <div class={styles.card}>
      <span class={styles.name}>{props.name}</span>
      <span class={styles.municipality}>
        <Show when={props.municipality} fallback="Sin municipio registrado">
          {props.municipality}
        </Show>
      </span>
    </div>
  );
}
