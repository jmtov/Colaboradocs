import {
  groupTasks,
  type NewTask,
  type Task,
  type TaskPatch,
  todayIso,
} from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createMemo, createSignal, onMount } from 'solid-js';
import NewTaskSheet from '@/NewTaskSheet/NewTaskSheet';
import { documentPath, navigate } from '@/router/router';

/** Estado y acciones de «Mis tareas». */
export function useTasksPage() {
  const review = useReview();
  const overlay = useOverlay();
  const [documentFilter, setDocumentFilter] = createSignal('');

  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;
  const isAdmin = () => me()?.isAdmin === true;
  const today = () => todayIso(new Date());

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

  async function report(outcome: Promise<{ ok: boolean; message?: string }>) {
    const result = await outcome;
    if (!result.ok && result.message) review.flash(result.message);
  }

  async function startNew() {
    const reviewer = me();
    if (!reviewer) return;
    const task = await overlay.sheet(NewTaskSheet, {
      documents: review.documents() ?? [],
      people: isAdmin() ? review.tasks.people() : [],
      meId: reviewer.id,
      today: today(),
      documentId: documentFilter() || undefined,
    });
    if (task) await report(review.tasks.create(task as NewTask));
  }

  async function edit(task: Task) {
    const reviewer = me();
    if (!reviewer) return;
    const patch = await overlay.sheet(NewTaskSheet, {
      task,
      documents: [],
      people: isAdmin() ? review.tasks.people() : [],
      meId: reviewer.id,
      today: today(),
    });
    if (patch) await report(review.tasks.patch(task.id, patch as TaskPatch));
  }

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
    startNew: () => void startNew(),
    canEdit: (task: Task) => task.createdById === me()?.id || isAdmin(),
    edit: (task: Task) => void edit(task),
    canDelete: (task: Task) => task.createdById === me()?.id || isAdmin(),
    toggle: (task: Task, done: boolean) =>
      void report(review.tasks.setDone(task.id, done)),
    remove: (task: Task) => void report(review.tasks.remove(task.id)),
    openDocument: (id: string) => navigate(documentPath(id)),
    retry: () => void review.tasks.load(),
    offline: () => review.status() === 'error',
  };
}
