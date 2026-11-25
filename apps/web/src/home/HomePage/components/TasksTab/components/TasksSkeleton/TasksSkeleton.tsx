import { For } from 'solid-js';
import Skeleton from '@/shared/ui/Skeleton/Skeleton';
import styles from './TasksSkeleton.module.css';

const ROWS = [0, 1, 2, 3, 4];

/** La lista de tareas mientras llegan: un título de grupo y filas con casilla, texto y fecha. */
export default function TasksSkeleton() {
  return (
    <div class={styles.list} role="status" aria-label="Cargando tus tareas">
      <Skeleton width="6rem" height="0.75rem" />
      <For each={ROWS}>
        {(i) => (
          <div class={styles.row}>
            <Skeleton width="1.25rem" height="1.25rem" />
            <div class={styles.text}>
              <Skeleton width={i % 2 === 0 ? '70%' : '50%'} />
              <Skeleton width="30%" height="0.75rem" />
            </div>
            <Skeleton width="4rem" height="0.75rem" />
          </div>
        )}
      </For>
    </div>
  );
}
