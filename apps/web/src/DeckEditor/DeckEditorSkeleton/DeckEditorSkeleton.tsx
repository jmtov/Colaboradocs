import { For } from 'solid-js';
import Skeleton from '@/Skeleton/Skeleton';
import styles from './DeckEditorSkeleton.module.css';

const SLIDES = [0, 1, 2, 3, 4, 5];
const FIELDS = [0, 1, 2, 3, 4];

/** El editor de presentaciones mientras abre: la barra, la lista de slides, el lienzo y el panel de campos. */
export default function DeckEditorSkeleton() {
  return (
    <div class={styles.app} role="status" aria-label="Abriendo el editor">
      <header class={styles.toolbar}>
        <Skeleton width="12rem" height="2rem" />
        <Skeleton width="8rem" height="1.5rem" />
        <span class={styles.spacer} />
        <Skeleton width="6rem" height="2rem" />
        <Skeleton width="6rem" height="2rem" />
        <Skeleton width="7rem" height="2rem" />
      </header>
      <aside class={styles.list}>
        <For each={SLIDES}>{() => <Skeleton height="3.5rem" />}</For>
      </aside>
      <main class={styles.preview}>
        <div class={styles.slide} />
      </main>
      <aside class={styles.panel}>
        <Skeleton width="60%" height="1.5rem" />
        <For each={FIELDS}>{() => <Skeleton height="2.5rem" />}</For>
      </aside>
    </div>
  );
}
