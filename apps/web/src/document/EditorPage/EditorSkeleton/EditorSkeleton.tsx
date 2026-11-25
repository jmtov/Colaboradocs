import Skeleton from '@/shared/ui/Skeleton/Skeleton';
import SkeletonLines from '@/shared/ui/Skeleton/SkeletonLines';
import styles from './EditorSkeleton.module.css';

/** El editor de un documento mientras carga (y se descarga Tiptap): la barra, la botonera y el texto. */
export default function EditorSkeleton() {
  return (
    <>
      <header class={styles.bar}>
        <div class={styles.barInner}>
          <Skeleton width="2rem" height="2rem" />
          <div class={styles.actions}>
            <Skeleton width="6rem" height="2rem" />
            <Skeleton width="6rem" height="2rem" />
          </div>
        </div>
      </header>
      <main class={styles.page} role="status" aria-label="Cargando el editor">
        <Skeleton width="min(28rem, 80%)" height="2.5rem" />
        <Skeleton width="min(36rem, 90%)" />
        <div class={styles.toolbar}>
          <Skeleton width="100%" height="2.25rem" />
        </div>
        <SkeletonLines lines={4} />
        <SkeletonLines lines={5} />
        <SkeletonLines lines={3} />
      </main>
    </>
  );
}
