import Skeleton from '@/Skeleton/Skeleton';
import styles from './DeckSkeleton.module.css';

/** El visor de una presentación mientras llega: la barra y un lienzo 16:9 con un título y unas líneas. */
export default function DeckSkeleton() {
  return (
    <div
      class={styles.page}
      role="status"
      aria-label="Cargando la presentación"
    >
      <header class={styles.bar}>
        <Skeleton width="2rem" height="2rem" />
        <Skeleton width="2rem" height="2rem" />
      </header>
      <div class={styles.stage}>
        <div class={styles.slide}>
          <Skeleton width="50%" height="2.5rem" />
          <Skeleton width="70%" />
          <Skeleton width="60%" />
        </div>
      </div>
    </div>
  );
}
