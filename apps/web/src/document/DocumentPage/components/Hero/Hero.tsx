import { type DocumentKind, KIND_GROUPS } from '@colaboradocs/review-core';
import { Show } from 'solid-js';
import styles from './Hero.module.css';

type Props = {
  title: string;
  version: string;
  /** Clase de documento; «otro» no se rotula. */
  type?: DocumentKind;
  eyebrow?: string;
  lead?: string;
};

export default function Hero(props: Props) {
  /** El tipo como texto, antes de la línea de arriba; «otro» no se rotula. */
  const kind = () =>
    props.type && props.type !== 'other'
      ? KIND_GROUPS.find((group) => group.kind === props.type)?.singular
      : undefined;

  return (
    <section class={styles.hero}>
      <div class={styles.main}>
        <span class={styles.eyebrow}>
          <Show when={kind()}>{kind()} · </Show>
          {(props.eyebrow ?? 'Borrador · versión {version}').replace(
            '{version}',
            props.version,
          )}
        </span>
        <h1 class={styles.title}>{props.title}</h1>
        <Show when={props.lead}>
          <p class={styles.lead}>{props.lead}</p>
        </Show>
      </div>
    </section>
  );
}
