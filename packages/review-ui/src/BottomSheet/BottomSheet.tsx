import {
  createComputed,
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import CloseIcon from '../icons/CloseIcon';
import styles from './BottomSheet.module.css';
import { sheetShift } from './sheet.utils';

type Props = {
  open: boolean;
  title: string;
  /** Etiqueta pequeña sobre el título ("Glosario", "Fuentes"…). */
  kicker?: string;
  /** Título pequeño, para hojas cuyo contenido es lo importante. */
  compact?: boolean;
  onClose: () => void;
  children: JSX.Element;
};

/** Margen sobre la duración de la transición antes de cerrar por la fuerza (si no llega `transitionend`). */
const CLOSE_GRACE_MS = 80;

/**
 * Hoja inferior sobre `<dialog>`: capa superior, foco atrapado y Escape.
 * Entra y sale deslizándose desde abajo (la duración y la curva están en el CSS):
 * al abrir se muestra el diálogo y un instante después se marca `data-state="open"`,
 * que dispara la transición; al cerrar se marca `data-state="closing"` y el diálogo
 * (con su contenido) sigue abierto hasta que termina de salir.
 */
export default function BottomSheet(props: Props) {
  let dialog!: HTMLDialogElement;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  // Cada apertura o cierre invalida al anterior (un cuadro pendiente de una apertura vieja no debe pisar un cierre).
  let token = 0;
  const titleId = createUniqueId();
  // El contenido existe mientras la hoja está abierta y durante su animación de salida.
  const [rendered, setRendered] = createSignal(props.open);
  createComputed(() => {
    if (props.open) setRendered(true);
  });

  /** Duración de la transición según el CSS (0 si no hay, o si se pidió menos movimiento). */
  function transitionMs(): number {
    const raw = window.getComputedStyle(dialog).transitionDuration ?? '';
    const first = raw.split(',')[0]?.trim() ?? '';
    const seconds = first.endsWith('ms')
      ? Number.parseFloat(first) / 1000
      : Number.parseFloat(first);
    return Number.isFinite(seconds) ? seconds * 1000 : 0;
  }

  function finishClose() {
    clearTimeout(closeTimer);
    if (props.open) return; // se volvió a abrir mientras salía
    if (dialog.open) dialog.close();
    delete dialog.dataset.state;
    setRendered(false);
  }

  createEffect(() => {
    clearTimeout(closeTimer);
    token += 1;
    const mine = token;
    if (props.open) {
      if (!dialog.open) dialog.showModal();
      // Se fuerza el cálculo de estilo con la hoja fuera de pantalla; recién después se
      // pide el estado final, para que haya transición y no aparezca de golpe.
      dialog.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (mine === token && props.open) dialog.dataset.state = 'open';
      });
    } else if (dialog.open) {
      dialog.dataset.state = 'closing';
      const ms = transitionMs();
      if (ms <= 0) finishClose();
      else closeTimer = setTimeout(finishClose, ms + CLOSE_GRACE_MS);
    }
  });
  onCleanup(() => {
    clearTimeout(closeTimer);
    if (dialog.open) dialog.close();
  });

  // Con el teclado abierto, el <dialog> (fijo al viewport de diseño) puede quedar
  // lejos del borde del teclado. En vez de suponer dónde termina el viewport de
  // diseño (en iOS no coincide con innerHeight), se mide dónde está la hoja (sin su
  // transformación) y se lleva su borde inferior al borde inferior del viewport visible.
  createEffect(() => {
    const viewport = window.visualViewport;
    if (!props.open || !viewport) return;
    const align = () => {
      const visibleBottom = viewport.offsetTop + viewport.height;
      // La medida incluye la transformación actual (la animación de entrada y el
      // desplazamiento anterior): `sheetShift` la descuenta. No se reinicia
      // `--sheet-shift` para medir, porque eso cambiaría la transformación en pleno vuelo.
      const shift = sheetShift({
        measuredBottom: dialog.getBoundingClientRect().bottom,
        transform: window.getComputedStyle(dialog).transform,
        visibleBottom,
      });
      const maxHeight = Math.round(
        Math.min(window.innerHeight * 0.8, viewport.height * 0.9),
      );
      dialog.style.setProperty('--sheet-shift', `${shift}px`);
      dialog.style.setProperty('--sheet-max-height', `${maxHeight}px`);
    };
    align();
    viewport.addEventListener('resize', align);
    viewport.addEventListener('scroll', align);
    onCleanup(() => {
      viewport.removeEventListener('resize', align);
      viewport.removeEventListener('scroll', align);
      dialog.style.removeProperty('--sheet-shift');
      dialog.style.removeProperty('--sheet-max-height');
    });
  });

  function onTransitionEnd(event: TransitionEvent) {
    if (
      event.target === dialog &&
      event.propertyName === 'transform' &&
      dialog.dataset.state === 'closing'
    ) {
      finishClose();
    }
  }

  function onClick(event: MouseEvent) {
    // Un clic sobre el fondo oscuro llega con el propio <dialog> como destino.
    if (event.target === dialog) props.onClose();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape ya cierra el <dialog>
    <dialog
      ref={dialog}
      class={styles.sheet}
      aria-labelledby={titleId}
      onClick={onClick}
      onTransitionEnd={onTransitionEnd}
      // Escape: no se cierra el diálogo por su cuenta, sino por `open`, para que salga animado.
      on:cancel={(event: Event) => {
        event.preventDefault();
        props.onClose();
      }}
      onClose={() => props.onClose()}
    >
      <Show when={rendered()}>
        <div class={styles.inner}>
          <div class={styles.head}>
            <span class={styles.kicker}>{props.kicker}</span>
            <button type="button" class={styles.close} onClick={props.onClose}>
              <CloseIcon class={styles.icon} />
              Cerrar
            </button>
          </div>
          <h2
            id={titleId}
            class={styles.title}
            classList={{ [styles.compact]: props.compact }}
          >
            {props.title}
          </h2>
          {props.children}
        </div>
      </Show>
    </dialog>
  );
}
