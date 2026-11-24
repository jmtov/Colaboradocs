import {
  canManageTasks,
  type NewTask,
  type Task,
  type TaskPatch,
  validateNewTask,
  validateTaskPatch,
} from '@colaboradocs/review-core';
import { Hono } from 'hono';
import { requireReviewer } from '@/auth/auth.middleware';
import {
  deleteTask,
  documentExists,
  findTask,
  insertTask,
  isActiveReviewer,
  listAssignablePeople,
  listTasks,
  updateTask,
} from '@/db/tasks.queries';
import type { AppEnv } from '@/env.types';
import { errorResponse, readJsonObject } from '@/http.utils';

const DOCUMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

export const tasksRoute = new Hono<AppEnv>()
  .use('/tasks', requireReviewer)
  .use('/tasks/*', requireReviewer)

  // Las personas a quienes se puede asignar (para el selector de admins).
  .get('/tasks/people', async (c) =>
    c.json(await listAssignablePeople(c.env.DB)),
  )

  // Por defecto, las mías. `?document=<id>` trae las de ese documento (de todas las
  // personas, para que el equipo las vea). `?scope=all` trae todas y es de admins.
  .get('/tasks', async (c) => {
    const reviewer = c.get('reviewer');
    const documentId = c.req.query('document');
    if (documentId !== undefined) {
      if (!DOCUMENT_ID_PATTERN.test(documentId)) {
        return errorResponse(c, 'invalid_request');
      }
      return c.json(await listTasks(c.env.DB, { documentId }));
    }
    const scope = c.req.query('scope') ?? 'mine';
    if (scope === 'all') {
      if (!canManageTasks(reviewer)) return errorResponse(c, 'forbidden');
      return c.json(await listTasks(c.env.DB, {}));
    }
    if (scope !== 'mine') return errorResponse(c, 'invalid_request');
    return c.json(await listTasks(c.env.DB, { assigneeId: reviewer.id }));
  })

  .post('/tasks', async (c) => {
    const reviewer = c.get('reviewer');
    const checked = validateNewTask(await readJsonObject(c));
    if (!checked.ok) return errorResponse(c, 'invalid_request', checked.errors);
    const input: NewTask = checked.value;
    const assigneeId = input.assigneeId ?? reviewer.id;
    // Cualquiera se asigna a sí misma; asignar a otra persona es de admins y del agente.
    if (assigneeId !== reviewer.id && !canManageTasks(reviewer)) {
      return errorResponse(c, 'forbidden');
    }
    if (!(await isActiveReviewer(c.env.DB, assigneeId))) {
      return errorResponse(c, 'invalid_request', [
        'Esa persona no existe o ya no tiene acceso.',
      ]);
    }
    if (
      input.documentId &&
      !(await documentExists(c.env.DB, input.documentId))
    ) {
      return errorResponse(c, 'invalid_request', ['Ese documento no existe.']);
    }
    const id = crypto.randomUUID();
    await insertTask(
      c.env.DB,
      { ...input, assigneeId },
      reviewer.id,
      id,
      new Date().toISOString(),
    );
    return c.json(await findTask(c.env.DB, id), 201);
  })

  // Marcar hecha: quien la tiene o un admin. Título, fecha y documento: quien la creó o un admin.
  // Pasarla a otra persona: solo admins.
  .patch('/tasks/:id', async (c) => {
    const reviewer = c.get('reviewer');
    const task = await findTask(c.env.DB, c.req.param('id'));
    if (!task) return errorResponse(c, 'not_found');
    const checked = validateTaskPatch(await readJsonObject(c));
    if (!checked.ok) return errorResponse(c, 'invalid_request', checked.errors);
    const patch = checked.value;
    if (!canChange(task, patch, reviewer)) return errorResponse(c, 'forbidden');
    if (
      patch.assigneeId !== undefined &&
      !(await isActiveReviewer(c.env.DB, patch.assigneeId))
    ) {
      return errorResponse(c, 'invalid_request', [
        'Esa persona no existe o ya no tiene acceso.',
      ]);
    }
    const documentId =
      patch.documentId !== undefined ? patch.documentId : task.documentId;
    if (patch.blockId && !documentId) {
      return errorResponse(c, 'invalid_request', [
        'Un bloque necesita su documento.',
      ]);
    }
    if (
      patch.documentId &&
      !(await documentExists(c.env.DB, patch.documentId))
    ) {
      return errorResponse(c, 'invalid_request', ['Ese documento no existe.']);
    }
    await updateTask(c.env.DB, task.id, patch, new Date().toISOString());
    return c.json(await findTask(c.env.DB, task.id));
  })

  .delete('/tasks/:id', async (c) => {
    const reviewer = c.get('reviewer');
    const task = await findTask(c.env.DB, c.req.param('id'));
    if (!task) return errorResponse(c, 'not_found');
    if (task.createdById !== reviewer.id && !reviewer.isAdmin) {
      return errorResponse(c, 'forbidden');
    }
    await deleteTask(c.env.DB, task.id);
    return c.body(null, 204);
  });

/** Quién puede cambiar qué: ver los comentarios de la ruta. */
function canChange(
  task: Task,
  patch: TaskPatch,
  reviewer: { id: string; isAdmin: boolean },
): boolean {
  if (reviewer.isAdmin) return true;
  if (patch.assigneeId !== undefined) return false;
  if (patch.done !== undefined && task.assigneeId !== reviewer.id) {
    return false;
  }
  const editsDetails =
    patch.title !== undefined ||
    patch.dueDate !== undefined ||
    patch.documentId !== undefined ||
    patch.blockId !== undefined;
  return !editsDetails || task.createdById === reviewer.id;
}
