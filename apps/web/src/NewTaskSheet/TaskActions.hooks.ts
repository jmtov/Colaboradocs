import {
  type NewTask,
  type Task,
  type TaskPatch,
  todayIso,
} from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import NewTaskSheet from '@/NewTaskSheet/NewTaskSheet';

type CreateOptions = {
  /** Documento preseleccionado. */
  documentId?: string;
  /** El documento ya está dado: no se muestra el selector. */
  documentLocked?: boolean;
};

/** Crear, editar, marcar y borrar tareas desde cualquier pantalla: se guardan al instante. */
export function useTaskActions() {
  const review = useReview();
  const overlay = useOverlay();

  const me = () => review.snapshot()?.me ?? review.session()?.reviewer;
  const isAdmin = () => me()?.isAdmin === true;
  const today = () => todayIso(new Date());

  async function report(outcome: Promise<{ ok: boolean; message?: string }>) {
    const result = await outcome;
    if (!result.ok && result.message) review.flash(result.message);
  }

  async function create(options: CreateOptions = {}) {
    const reviewer = me();
    if (!reviewer) return;
    const task = await overlay.sheet(NewTaskSheet, {
      documents: options.documentLocked ? [] : (review.documents() ?? []),
      people: isAdmin() ? review.tasks.people() : [],
      meId: reviewer.id,
      today: today(),
      documentId: options.documentId,
      documentLocked: options.documentLocked,
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
    me,
    isAdmin,
    today,
    create: (options?: CreateOptions) => void create(options),
    edit: (task: Task) => void edit(task),
    toggle: (task: Task, done: boolean) =>
      void report(review.tasks.setDone(task.id, done)),
    remove: (task: Task) => void report(review.tasks.remove(task.id)),
    /** Editan y borran quien la creó o un admin. */
    canChange: (task: Task) => task.createdById === me()?.id || isAdmin(),
    /** La marca quien la tiene o un admin. */
    canToggle: (task: Task) => task.assigneeId === me()?.id || isAdmin(),
  };
}
