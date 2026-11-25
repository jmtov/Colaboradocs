import { For } from 'solid-js';
import Skeleton from '@/shared/ui/Skeleton/Skeleton';
import SkeletonLines from '@/shared/ui/Skeleton/SkeletonLines';
import styles from './HomeSkeleton.module.css';

const CARDS = [0, 1, 2, 3, 4, 5];

/** La home mientras llegan las listas: la barra, el título, los tabs y una cuadrícula de tarjetas. */
export default function HomeSkeleton() {
  return (
    <>
      <header class={styles.bar}>
        <div class={styles.barInner}>
          <Skeleton width="8rem" />
          <Skeleton width="2rem" height="2rem" />
        </div>
      </header>
      <main class={styles.page} role="status" aria-label="Cargando">
        <Skeleton
          class={styles.title}
          width="min(24rem, 70%)"
          height="2.5rem"
        />
        <div class={styles.tabs}>
          <Skeleton width="7rem" height="2rem" />
          <Skeleton width="7rem" height="2rem" />
          <Skeleton width="7rem" height="2rem" />
        </div>
        <Skeleton height="2.5rem" />
        <ul class={styles.grid}>
          <For each={CARDS}>
            {() => (
              <li class={styles.card}>
                <Skeleton width="40%" height="0.75rem" />
                <Skeleton width="80%" height="1.5rem" />
                <SkeletonLines lines={2} />
              </li>
            )}
          </For>
        </ul>
      </main>
    </>
  );
}
