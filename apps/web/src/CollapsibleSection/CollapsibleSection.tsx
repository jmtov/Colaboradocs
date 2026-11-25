import { createSignal, type JSX, Show } from 'solid-js';
import ChevronDownIcon from '@/icons/ChevronDownIcon';
import styles from './CollapsibleSection.module.css';

type Props = {
  /** Id del título (para `aria-labelledby`). */
  id: string;
  title: string;
  /** Lo que se ve junto al título mientras está plegada: «(2)», «(7 secciones)». */
  note?: string;
  children: JSX.Element;
  /** Si arranca abierta. Por defecto sí. */
  defaultOpen?: boolean;
  /** Clase de la sección (márgenes). */
  class?: string;
};

/** Una sección con título que se pliega; el estado no se guarda. */
export default function CollapsibleSection(props: Props) {
  const [open, setOpen] = createSignal(props.defaultOpen ?? true);

  return (
    <section class={props.class} aria-labelledby={props.id}>
      <h2 id={props.id} class={styles.heading}>
        <button
          type="button"
          data-flat
          class={styles.toggle}
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          {props.title}
          <Show when={!open() && props.note}>
            <span class={styles.note}>{props.note}</span>
          </Show>
          <ChevronDownIcon
            class={`${styles.chevron} ${open() ? '' : styles.closed}`}
          />
        </button>
      </h2>
      <Show when={open()}>{props.children}</Show>
    </section>
  );
}
