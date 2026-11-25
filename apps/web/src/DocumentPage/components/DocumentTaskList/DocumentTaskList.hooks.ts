import { compareTasks, type Task } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createMemo, createSignal, onMount } from 'solid-js';
import { useTaskActions } from '@/NewTaskSheet/TaskActions.hooks';

type TaskGroup = { id: string; name: string; tasks: Task[] };

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

  /** Las tareas repartidas por persona (primero las mías, luego alfabético); dentro de cada una, pendientes por fecha y luego hechas. */
  const groups = createMemo(() => {
    const byPerson = new Map<string, TaskGroup>();
    for (const task of tasks()) {
      const group = byPerson.get(task.assigneeId) ?? {
        id: task.assigneeId,
        name: task.assigneeMunicipality
          ? `${task.assigneeName} (${task.assigneeMunicipality})`
          : task.assigneeName,
        tasks: [],
      };
      group.tasks.push(task);
      byPerson.set(task.assigneeId, group);
    }
    const meId = actions.me()?.id;
    return [...byPerson.values()].sort(
      (a, b) =>
        Number(b.id === meId) - Number(a.id === meId) ||
        a.name.localeCompare(b.name, 'es'),
    );
  });

  const [collapsed, setCollapsed] = createSignal<ReadonlySet<string>>(
    new Set(),
  );
  const isCollapsed = (id: string) => collapsed().has(id);
  const toggleGroup = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return {
    tasks,
    groups,
    isMe: (id: string) => id === actions.me()?.id,
    isCollapsed,
    toggleGroup,
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
