import type {
  NewTask,
  Task,
  TaskPatch,
  TaskPerson,
} from '@colaboradocs/review-core';
import { createSignal } from 'solid-js';
import { ApiRequestError, type ReviewApi } from '../api/review.api';
import { describeTaskError } from './review.messages';

export type TaskOutcome = { ok: true } | { ok: false; message: string };

/** Las tareas de quien entró: cargar, crear, marcar hecha y borrar. */
export function createTasksStore(api: ReviewApi) {
  // null = todavía no se pidieron.
  const [tasks, setTasks] = createSignal<Task[] | null>(null);
  const [people, setPeople] = createSignal<TaskPerson[]>([]);
  const [failed, setFailed] = createSignal(false);
  // Las tareas de un documento (las de todas las personas), mientras se mira uno.
  const [documentTasks, setDocumentTasks] = createSignal<Task[] | null>(null);
  let documentId: string | null = null;

  async function load() {
    try {
      setTasks(await api.fetchMyTasks());
      setFailed(false);
    } catch (error) {
      const unauthorized =
        error instanceof ApiRequestError && error.status === 401;
      if (!unauthorized && tasks() === null) setFailed(true);
    }
  }

  /**
   * Las tareas de un documento; mientras haya uno abierto, cada cambio las vuelve a pedir.
   * Solo se vacían al cambiar de documento: al recargar el mismo se conservan hasta que
   * llegan las nuevas. Vaciarlas encoge la página y el navegador mueve el scroll.
   */
  async function loadForDocument(id: string) {
    if (documentId !== id) setDocumentTasks(null);
    documentId = id;
    try {
      const fetched = await api.fetchDocumentTasks(id);
      if (documentId === id) setDocumentTasks(fetched);
    } catch {
      if (documentId === id) setDocumentTasks([]);
    }
  }

  /** Las personas a quienes se puede asignar; una sola vez basta, la lista casi no cambia. */
  async function loadPeople() {
    try {
      setPeople(await api.fetchTaskPeople());
    } catch {
      // Sin la lista el selector queda con quien crea la tarea; no es crítico.
    }
  }

  /** Vuelve a pedir lo que ya se había cargado: mis tareas y las del documento abierto. */
  async function reload() {
    const id = documentId;
    await Promise.all([
      tasks() !== null ? load() : undefined,
      id !== null ? loadForDocument(id) : undefined,
    ]);
  }

  /** Corre una acción sobre las tareas; si falla, devuelve el motivo y recarga la lista real. */
  async function act(action: () => Promise<unknown>): Promise<TaskOutcome> {
    try {
      await action();
      await reload();
      return { ok: true };
    } catch (error) {
      const message = describeTaskError(error);
      await reload();
      return { ok: false, message };
    }
  }

  return {
    tasks,
    documentTasks,
    people,
    failed,
    load,
    loadForDocument,
    loadPeople,
    create: (task: NewTask) => act(() => api.postTask(task)),
    patch: (id: string, patch: TaskPatch) =>
      act(() => api.patchTask(id, patch)),
    setDone: (id: string, done: boolean) =>
      act(() => api.patchTask(id, { done })),
    remove: (id: string) => act(() => api.deleteTask(id)),
  };
}
