import { Button } from '@colaboradocs/review-ui';
import {
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import CloseIcon from '@/icons/CloseIcon';
import { SLIDE_MS } from './PaneSheet.constants';
import styles from './PaneSheet.module.css';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: JSX.Element;
};

/**
 * Una hoja que sube desde abajo con el ancho del panel de la diapositiva y casi todo su alto.
 * Solo se oscurece el panel (la barra y la vista previa siguen a la vista y a mano). Entra y sale
 * con animación; se cierra con «Cerrar» o con Esc.
 */
export default function PaneSheet(props: Props) {
  const [mounted, setMounted] = createSignal(false);
  const [shown, setShown] = createSignal(false);
  createEffect(() => {
    if (props.open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setShown(true));
      onCleanup(() => cancelAnimationFrame(frame));
    } else {
      setShown(false);
      const timer = setTimeout(() => setMounted(false), SLIDE_MS);
      onCleanup(() => clearTimeout(timer));
    }
  });

  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  return (
    <Show when={mounted()}>
      <div class={styles.backdrop} classList={{ [styles.shown]: shown() }}>
        <section class={styles.sheet} role="dialog" aria-label={props.title}>
          <header class={styles.bar}>
            <h2 class={styles.title}>{props.title}</h2>
            <Button
              icon={CloseIcon}
              size="sm"
              title="Cerrar"
              onClick={() => props.onClose()}
            >
              Cerrar
            </Button>
          </header>
          <div class={styles.body}>{props.children}</div>
        </section>
      </div>
    </Show>
  );
}
