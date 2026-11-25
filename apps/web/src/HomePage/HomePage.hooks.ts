import { useReview } from '@colaboradocs/review-ui';
import { createEffect, createSignal, on, onMount } from 'solid-js';
import { createPageTransition } from '@/router/pageTransition';
import type { HomeTab } from '@/router/router';
import { transitionMs } from '@/router/transition.utils';
import { TAB_ORDER } from './HomePage.constants';

/** Lo que el marco de la home necesita saber: si quien mira es admin, si hay conexión y cuántas tareas tiene pendientes (para el tab). */
export function useHomePage() {
  const review = useReview();

  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;

  // Las tareas se piden al entrar a la home: el tab muestra cuántas hay pendientes en cualquiera de los tres.
  onMount(() => void review.tasks.load());

  return {
    isAdmin,
    offline: () => review.status() === 'error',
    /** Las tareas sin hacer; null mientras no cargan. */
    pendingTasks: () => {
      const tasks = review.tasks.tasks();
      return tasks === null
        ? null
        : tasks.filter((task) => !task.doneAt).length;
    },
  };
}

/**
 * El contenido del tab con transición: el que sale se desvanece y se desliza hacia donde queda su tab
 * (a la izquierda si el nuevo está a la derecha), y el nuevo entra desde el lado contrario. Reutiliza
 * la transición de páginas de la app; la duración sale del CSS (0 con «reducir movimiento»).
 */
export function useTabContent(tab: () => HomeTab) {
  const refs = {} as { content: HTMLDivElement };
  // +1 si el tab nuevo está a la derecha del anterior, -1 si a la izquierda. Se fija antes de que arranque la salida.
  const [direction, setDirection] = createSignal<1 | -1>(1);
  createEffect(
    on(
      tab,
      (next, previous) => {
        if (previous)
          setDirection(TAB_ORDER[next] > TAB_ORDER[previous] ? 1 : -1);
      },
      { defer: true },
    ),
  );
  const { displayed, phase } = createPageTransition({
    path: tab,
    duration: () => transitionMs(refs.content),
    instant: () => false,
  });
  return {
    refs,
    /** El tab cuyo contenido se muestra ahora (va un paso por detrás de la URL mientras anima). */
    shown: displayed as () => HomeTab,
    phase,
    direction,
  };
}
