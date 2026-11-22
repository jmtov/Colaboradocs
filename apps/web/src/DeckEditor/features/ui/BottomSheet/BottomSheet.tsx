import {
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import CloseIcon from '../icons/CloseIcon';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Botones junto a «Cerrar» (p. ej. eliminar). */
  actions?: JSX.Element;
  children: JSX.Element;
}

/** Cuánto dura la animación de entrada y salida (debe coincidir con el CSS). */
const SLIDE_MS = 260;

/**
 * Una hoja que sube desde abajo con el ancho del panel y casi todo el alto. Solo se oscurece el
 * panel (no la barra de herramientas); el resto de la pantalla sigue a la vista. Entra y sale con animación. Se cierra con el
 * botón o con Esc.
 */
export default function BottomSheet(props: BottomSheetProps) {
  const [mounted, setMounted] = createSignal(false);
  const [shown, setShown] = createSignal(false);
  // la capa empieza bajo la barra de herramientas: sus botones no se oscurecen
  const [top, setTop] = createSignal(0);

  createEffect(() => {
    if (props.open) {
      setTop(
        document.querySelector('[data-app-toolbar]')?.getBoundingClientRect()
          .bottom ?? 0,
      );
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
      <div
        class={styles.backdrop}
        classList={{ [styles.shown]: shown() }}
        style={{ top: `${top()}px` }}
      >
        <section class={styles.sheet} role="dialog" aria-label={props.title}>
          <header class={styles.bar}>
            <h2 class={styles.title}>{props.title}</h2>
            {props.actions}
            <button
              type="button"
              class="btn"
              onClick={() => props.onClose()}
              title="Cerrar"
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
          </header>
          <div class={styles.body}>{props.children}</div>
        </section>
      </div>
    </Show>
  );
}
