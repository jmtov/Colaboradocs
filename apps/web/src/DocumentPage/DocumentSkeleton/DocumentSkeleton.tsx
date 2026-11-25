import Skeleton from '@/Skeleton/Skeleton';
import SkeletonLines from '@/Skeleton/SkeletonLines';
import styles from './DocumentSkeleton.module.css';

/** Un documento mientras llega: la barra, el título y, junto al índice, los párrafos. */
export default function DocumentSkeleton() {
  return (
    <>
      <header class={styles.bar}>
        <div class={styles.barInner}>
          <Skeleton width="2rem" height="2rem" />
          <Skeleton width="2rem" height="2rem" />
        </div>
      </header>
      <main
        class={styles.page}
        role="status"
        aria-label="Cargando el documento"
      >
        <div class={styles.intro}>
          <Skeleton width="6rem" height="0.75rem" />
          <Skeleton width="min(32rem, 80%)" height="2.5rem" />
          <Skeleton width="min(24rem, 60%)" />
        </div>
        <div class={styles.shell}>
          <nav class={styles.index}>
            <Skeleton width="70%" />
            <Skeleton width="85%" />
            <Skeleton width="60%" />
            <Skeleton width="75%" />
          </nav>
          <div class={styles.body}>
            <Skeleton width="14rem" height="1.5rem" />
            <SkeletonLines lines={4} />
            <Skeleton width="12rem" height="1.5rem" />
            <SkeletonLines lines={5} />
            <SkeletonLines lines={3} />
          </div>
        </div>
      </main>
    </>
  );
}
