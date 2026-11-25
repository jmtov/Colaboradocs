import { Show } from 'solid-js';
import UserMenu from '@/shared/ui/UserMenu/UserMenu';
import HomeTabs from './components/HomeTabs/HomeTabs';
import styles from './HomeShell.module.css';
import type { HomeShellProps } from './HomeShell.types';

/** El marco de la home: la barra con la cuenta, el título del espacio y los tabs; cada tab pone su contenido debajo. */
export default function HomeShell(props: HomeShellProps) {
  return (
    <>
      <header class={styles.bar}>
        <div class={styles.barInner}>
          <span class={styles.barName}>{props.name}</span>
          <div class={styles.account}>
            <Show when={props.offline}>
              <span role="status">Sin conexión</span>
            </Show>
            <UserMenu />
          </div>
        </div>
      </header>
      <main>
        <section class={`${styles.inner} ${styles.intro}`}>
          <h1 class={styles.title}>{props.name}</h1>
        </section>
        <HomeTabs
          tab={props.tab}
          counts={props.counts}
          showDecks={
            props.alwaysShowDecks ||
            props.counts.decks > 0 ||
            props.tab === 'decks'
          }
        />
        <div class={`${styles.inner} ${styles.content}`}>{props.children}</div>
      </main>
    </>
  );
}
