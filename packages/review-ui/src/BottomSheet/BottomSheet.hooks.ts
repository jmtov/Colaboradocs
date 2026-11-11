import {
  createComputed,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
} from 'solid-js';
import { sheetShift } from './sheet.utils';

/** Margen sobre la duración de la transición antes de cerrar por la fuerza (si no llega `transitionend`). */
const CLOSE_GRACE_MS = 80;

type BottomSheetOptions = {
  open: () => boolean;
  onClose: () => void;
};

/**
 * Estado, efectos y handlers de la hoja inferior. El `<dialog>` se enlaza con `setDialog`.
 */
export function useBottomSheet(options: BottomSheetOptions) {
  let dialog!: HTMLDialogElement;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  // Cada apertura o cierre invalida al anterior (un cuadro pendiente de una apertura vieja no debe pisar un cierre).
  let token = 0;
  const titleId = createUniqueId();
  // El contenido existe mientras la hoja está abierta y durante su animación de salida.
  const [rendered, setRendered] = createSignal(options.open());
  createComputed(() => {
    if (options.open()) setRendered(true);
  });

  function setDialog(element: HTMLDialogElement) {
    dialog = element;
  }

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
    if (options.open()) return; // se volvió a abrir mientras salía
    if (dialog.open) dialog.close();
    delete dialog.dataset.state;
    setRendered(false);
  }

  createEffect(() => {
    clearTimeout(closeTimer);
    token += 1;
    const mine = token;
    if (options.open()) {
      if (!dialog.open) dialog.showModal();
      // Se fuerza el cálculo de estilo con la hoja fuera de pantalla; recién después se
      // pide el estado final, para que haya transición y no aparezca de golpe.
      dialog.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (mine === token && options.open()) dialog.dataset.state = 'open';
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
    if (!options.open() || !viewport) return;
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

  function onBackdropClick(event: MouseEvent) {
    // Un clic sobre el fondo oscuro llega con el propio <dialog> como destino.
    if (event.target === dialog) options.onClose();
  }

  function onCancel(event: Event) {
    event.preventDefault();
    options.onClose();
  }

  return {
    titleId,
    rendered,
    setDialog,
    onTransitionEnd,
    onBackdropClick,
    onCancel,
    onNativeClose: () => options.onClose(),
    onCloseClick: () => options.onClose(),
  };
}
