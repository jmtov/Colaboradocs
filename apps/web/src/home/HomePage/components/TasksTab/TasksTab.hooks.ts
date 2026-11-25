import { groupTasks, matchesQuery } from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { documentPath, navigate } from '@/shared/router/router';
import { useTaskActions } from '@/task/components/NewTaskSheet/TaskActions.hooks';
import TaskFiltersSheet from './components/TaskFiltersSheet/TaskFiltersSheet';

/** Estado y acciones del tab de tareas. */
export function useTasksTab() {
  const review = useReview();
  const overlay = useOverlay();
  const [query, setQuery] = createSignal('');
  const [documentIds, setDocumentIds] = createSignal<string[]>([]);

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
    const chosen = documentIds();
    return (review.tasks.tasks() ?? []).filter(
      (task) =>
        (chosen.length === 0 ||
          (task.documentId !== null && chosen.includes(task.documentId))) &&
        matchesQuery(query(), [task.title, task.documentTitle]),
    );
  });
  const groups = createMemo(() => groupTasks(visible(), today()));
  /** Los documentos que tienen tareas mías, con cuántas, para el filtro. */
  const filterOptions = createMemo(() => {
    const seen = new Map<string, { title: string; count: number }>();
    for (const task of review.tasks.tasks() ?? []) {
      if (!task.documentId) continue;
      const entry = seen.get(task.documentId);
      if (entry) entry.count += 1;
      else
        seen.set(task.documentId, {
          title: task.documentTitle ?? task.documentId,
          count: 1,
        });
    }
    return [...seen].map(([id, { title, count }]) => ({ id, title, count }));
  });
  // Si un documento elegido ya no tiene tareas (se borró la última), se suelta de la selección.
  createEffect(() => {
    const available = new Set(filterOptions().map((option) => option.id));
    const chosen = documentIds();
    if (chosen.some((id) => !available.has(id))) {
      setDocumentIds(chosen.filter((id) => available.has(id)));
    }
  });

  return {
    status: () => {
      if (review.tasks.tasks() !== null) return 'ready';
      return review.tasks.failed() ? 'error' : 'loading';
    },
    groups,
    today,
    hasAny: () => (review.tasks.tasks() ?? []).length > 0,
    query,
    setQuery,
    filterOptions,
    visibleCount: () => visible().length,
    totalCount: () => (review.tasks.tasks() ?? []).length,
    /** Lo filtrado ahora, para el botón que lo quita («Votación AMO», «2 documentos»). */
    activeLabel: () => {
      const chosen = documentIds();
      if (chosen.length === 0) return null;
      if (chosen.length > 1) return `${chosen.length} documentos`;
      return (
        filterOptions().find((item) => item.id === chosen[0])?.title ?? null
      );
    },
    openFilters: async () => {
      const result = await overlay.sheet(TaskFiltersSheet, {
        documentIds: documentIds(),
        documents: filterOptions(),
      });
      if (result) setDocumentIds(result.documentIds);
    },
    clearFilter: () => {
      setQuery('');
      setDocumentIds([]);
    },
    // Con un solo documento elegido, la tarea nueva parte de él.
    startNew: () =>
      actions.create({
        documentId: documentIds().length === 1 ? documentIds()[0] : undefined,
      }),
    canChange: actions.canChange,
    edit: actions.edit,
    toggle: actions.toggle,
    remove: actions.remove,
    openDocument: (id: string) => navigate(documentPath(id)),
    retry: () => void review.tasks.load(),
  };
}
