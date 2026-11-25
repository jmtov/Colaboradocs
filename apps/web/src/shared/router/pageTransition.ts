import { createEffect, createSignal, on, onCleanup, untrack } from 'solid-js';

/**
 * - `idle`: la página está en su lugar.
 * - `leaving`: la página actual se desvanece y se desplaza un poco (salida).
 * - `entering`: acaba de cambiar el contenido; la página nueva está oculta y
 *   desplazada, lista para entrar. Dura un instante: lo justo para que el
 *   navegador pinte ese estado y la transición a `idle` sea visible.
 */
export type PagePhase = 'idle' | 'leaving' | 'entering';

/** Tiempo que `entering` se mantiene antes de pasar a `idle` (un par de cuadros). */
export const ENTER_FRAME_MS = 40;

type Options = {
  /** La ruta a la que se quiere ir (la URL). */
  path: () => string;
  /** Duración de cada transición (salida y entrada), en ms; 0 si no hay (p. ej. «reducir movimiento»). */
  duration: () => number;
  /** Si el cambio actual no debe animarse (una redirección). Se consulta al cambiar la ruta. */
  instant: () => boolean;
  /** Se llama cuando cambia el contenido (p. ej. para volver arriba). */
  onSwap?: () => void;
};

/**
 * Hace que la ruta que se **muestra** vaya un paso por detrás de la URL: al
 * navegar, la página actual sale (`leaving`), se cambia el contenido y la nueva
 * entra (`entering` → `idle`). Navegar otra vez mientras sale no apila animaciones:
 * al terminar la salida se muestra la ruta más reciente.
 */
export function createPageTransition(options: Options) {
  const [displayed, setDisplayed] = createSignal(untrack(options.path));
  const [phase, setPhase] = createSignal<PagePhase>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  function swap(animated: boolean) {
    clearTimeout(timer);
    setDisplayed(options.path());
    options.onSwap?.();
    if (!animated) {
      setPhase('idle');
      return;
    }
    setPhase('entering');
    timer = setTimeout(() => setPhase('idle'), ENTER_FRAME_MS);
  }

  createEffect(
    on(
      options.path,
      (path) => {
        if (path === untrack(displayed)) {
          // Volvió a la página que se estaba mostrando: se cancela la salida.
          if (untrack(phase) === 'leaving') {
            clearTimeout(timer);
            setPhase('idle');
          }
          return;
        }
        if (options.instant() || options.duration() <= 0) {
          swap(false);
          return;
        }
        // Ya está saliendo: el temporizador en curso mostrará la ruta más reciente.
        if (untrack(phase) === 'leaving') return;
        clearTimeout(timer);
        setPhase('leaving');
        timer = setTimeout(() => swap(true), options.duration());
      },
      { defer: true },
    ),
  );
  onCleanup(() => clearTimeout(timer));

  return { displayed, phase };
}
