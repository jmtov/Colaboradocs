import { type JSX, Show } from 'solid-js';
import Link from '@/router/Link';
import styles from './Card.module.css';

type Props = {
  href: string;
  /** La línea de arriba, en monoespaciado («Acta · 2026-11-24»). */
  meta: string;
  title: string;
  description?: string | null;
  /** El pie, a la izquierda (contadores). */
  footer?: JSX.Element;
  /** El pie, a la derecha («justo ahora»). */
  time: string;
  /** El menú de la esquina (solo admins): va fuera del enlace. */
  menu?: JSX.Element;
  /** Entre el título y el pie (personas…). */
  children?: JSX.Element;
};

/** Una tarjeta de la home: un documento o una presentación. */
export default function Card(props: Props) {
  return (
    <li class={styles.item}>
      <Link
        lift
        href={props.href}
        class={props.menu ? `${styles.card} ${styles.withMenu}` : styles.card}
      >
        <span class={styles.meta}>{props.meta}</span>
        <span class={styles.title}>{props.title}</span>
        <Show when={props.description}>
          <span class={styles.description}>{props.description}</span>
        </Show>
        {props.children}
        <span class={styles.footer}>
          {props.footer}
          <span class={styles.time}>{props.time}</span>
        </span>
      </Link>
      <Show when={props.menu}>
        <div class={styles.menu}>{props.menu}</div>
      </Show>
    </li>
  );
}
