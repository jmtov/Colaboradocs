import { Show } from 'solid-js';
import ArrowDownIcon from '@/icons/ArrowDownIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import styles from './Hero.module.css';

type Props = {
  title: string;
  version: string;
  firstSectionId: string;
  eyebrow?: string;
  lead?: string;
  highlight?: { id: string; label: string };
  onGo: (sectionId: string) => void;
};

export default function Hero(props: Props) {
  return (
    <section class={styles.hero}>
      <div class={styles.main}>
        <span class={styles.eyebrow}>
          {(props.eyebrow ?? 'Borrador · versión {version}').replace(
            '{version}',
            props.version,
          )}
        </span>
        <h1 class={styles.title}>{props.title}</h1>
        <Show when={props.lead}>
          <p class={styles.lead}>{props.lead}</p>
        </Show>
        <div class={styles.actions}>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            onClick={() => props.onGo(props.firstSectionId)}
          >
            <ArrowDownIcon class={styles.icon} />
            Leer el documento
          </button>
          <Show when={props.highlight}>
            {(highlight) => (
              <button
                type="button"
                class={styles.button}
                onClick={() => props.onGo(highlight().id)}
              >
                <ListChecksIcon class={styles.icon} />
                {highlight().label}
              </button>
            )}
          </Show>
        </div>
      </div>
      <div class={styles.howto}>
        <span class={styles.eyebrow}>Cómo revisar</span>
        <ol class={styles.steps}>
          <li class={styles.step}>
            <b class={styles.number}>01</b>
            <span>
              Toca un párrafo o una viñeta: aparece la barra para{' '}
              <strong>Comentar</strong> o dar tu <strong>OK</strong>.
            </span>
          </li>
          <li class={styles.step}>
            <b class={styles.number}>02</b>
            <span>
              Cada comentario abre un hilo: puedes <strong>responder</strong> a
              los de los demás.
            </span>
          </li>
          <li class={styles.step}>
            <b class={styles.number}>03</b>
            <span>
              Toca el encabezado de arriba para ver el contenido y saltar a una
              sección.
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
