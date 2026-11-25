import { useReview } from '@colaboradocs/review-ui';
import { onMount } from 'solid-js';

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
