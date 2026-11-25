import styles from './Skeleton.module.css';

type Props = {
  /** Ancho (cualquier medida CSS); por omisión, todo el disponible. */
  width?: string;
  /** Alto (cualquier medida CSS); por omisión, una línea de texto. */
  height?: string;
  /** Solo para ubicarlo en su contenedor (margen, área de la cuadrícula). */
  class?: string;
};

/** Un hueco gris con un brillo que pasa: ocupa el lugar de lo que aún no llega. Decorativo; quien lo usa pone el `role="status"`. */
export default function Skeleton(props: Props) {
  return (
    <span
      class={`${styles.bone} ${props.class ?? ''}`}
      // biome-ignore lint/plugin: ancho y alto llegan de quien lo usa; el CSS los aplica
      style={{ '--skeleton-w': props.width, '--skeleton-h': props.height }}
      aria-hidden="true"
    />
  );
}
