import { groupTasks } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createMemo, createSignal, onMount } from 'solid-js';
import { useTaskActions } from '@/NewTaskSheet/TaskActions.hooks';
import { documentPath, navigate } from '@/router/router';

/** Estado y acciones de «Mis tareas». */
export function useTasksPage() {
  const review = useReview();
  const [documentFilter, setDocumentFilter] = createSignal('');

  const actions = useTaskActions();
  const isAdmin = actions.isAdmin;
  const today = actions.today;

  // Una vez al entrar: las tareas, los documentos (para el filtro y el selector) y, si eres
  // admin, las personas a quienes asignar.
  onMount(() => {
    void review.tasks.load();
    void review.loadDocuments();
    if (isAdmin()) void review.tasks.loadPeople();
  });

  const visible = createMemo(() => {
    const all = review.tasks.tasks() ?? [];
    const only = documentFilter();
    return only ? all.filter((task) => task.documentId === only) : all;
  });
  const groups = createMemo(() => groupTasks(visible(), today()));
  /** Los documentos que tienen tareas mías, para el filtro. */
  const filterOptions = createMemo(() => {
    const seen = new Map<string, string>();
    for (const task of review.tasks.tasks() ?? []) {
      if (task.documentId) {
        seen.set(task.documentId, task.documentTitle ?? task.documentId);
      }
    }
    return [...seen].map(([id, title]) => ({ id, title }));
  });

  return {
    status: () => {
      if (review.tasks.tasks() !== null) return 'ready';
      return review.tasks.failed() ? 'error' : 'loading';
    },
    groups,
    today,
    hasAny: () => (review.tasks.tasks() ?? []).length > 0,
    documentFilter,
    setDocumentFilter,
    filterOptions,
    startNew: () =>
      actions.create({ documentId: documentFilter() || undefined }),
    canChange: actions.canChange,
    edit: actions.edit,
    toggle: actions.toggle,
    remove: actions.remove,
    openDocument: (id: string) => navigate(documentPath(id)),
    retry: () => void review.tasks.load(),
    offline: () => review.status() === 'error',
  };
}
