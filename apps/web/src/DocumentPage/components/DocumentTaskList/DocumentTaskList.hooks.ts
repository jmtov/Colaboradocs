import { compareTasks, type Task, todayIso } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createMemo, onMount } from 'solid-js';

/** Las tareas del documento que se está leyendo, de todas las personas. */
export function useDocumentTaskList(documentId: () => string) {
  const review = useReview();
  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;

  onMount(() => void review.tasks.loadForDocument(documentId()));

  const tasks = createMemo(() =>
    [...(review.tasks.documentTasks() ?? [])].sort(compareTasks),
  );

  async function toggle(task: Task, done: boolean) {
    const result = await review.tasks.setDone(task.id, done);
    if (!result.ok) review.flash(result.message);
  }

  return {
    tasks,
    today: () => todayIso(new Date()),
    /** Las marca quien las tiene o un admin; las demás personas solo las ven. */
    canToggle: (task: Task) =>
      task.assigneeId === me()?.id || me()?.isAdmin === true,
    toggle: (task: Task, done: boolean) => void toggle(task, done),
  };
}
