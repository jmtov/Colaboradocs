import { compareTasks } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createMemo, onMount } from 'solid-js';
import { useTaskActions } from '@/NewTaskSheet/TaskActions.hooks';

/** Las tareas del documento que se está leyendo, de todas las personas, y lo que se puede hacer con ellas. */
export function useDocumentTaskList(documentId: () => string) {
  const review = useReview();
  const actions = useTaskActions();

  onMount(() => {
    void review.tasks.loadForDocument(documentId());
    void review.loadDocuments();
    if (actions.isAdmin()) void review.tasks.loadPeople();
  });

  const tasks = createMemo(() =>
    [...(review.tasks.documentTasks() ?? [])].sort(compareTasks),
  );

  return {
    tasks,
    today: actions.today,
    canToggle: actions.canToggle,
    canChange: actions.canChange,
    toggle: actions.toggle,
    edit: actions.edit,
    remove: actions.remove,
    add: () =>
      actions.create({ documentId: documentId(), documentLocked: true }),
  };
}
