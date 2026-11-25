import { can, type NewTask, type Reviewer } from '@colaboradocs/review-core';
import { documentExists, isActiveReviewer } from '@/task/task.queries';

/** Una tarea lista para insertar, o por qué no se puede. */
export type ResolvedTask =
  | { ok: true; task: NewTask & { assigneeId: string } }
  | { ok: false; code: 'forbidden' | 'invalid_request'; details?: string[] };

/** Respuestas de las comprobaciones contra la base, que un lote repite para las mismas personas y documentos. */
export type TaskLookups = {
  people: Map<string, Promise<boolean>>;
  documents: Map<string, Promise<boolean>>;
};

export function newTaskLookups(): TaskLookups {
  return { people: new Map(), documents: new Map() };
}

function once(
  cache: Map<string, Promise<boolean>>,
  key: string,
  check: () => Promise<boolean>,
): Promise<boolean> {
  const cached = cache.get(key);
  if (cached) return cached;
  const result = check();
  cache.set(key, result);
  return result;
}

/**
 * Las reglas de crear una tarea, las mismas para una sola y para un lote: sin asignado es
 * de quien la crea; asignar a otra persona es de quien tiene `tasks:assign`; la persona
 * tiene que seguir con acceso y el documento, existir.
 */
export async function resolveNewTask(
  db: D1Database,
  reviewer: Reviewer,
  input: NewTask,
  lookups: TaskLookups = newTaskLookups(),
): Promise<ResolvedTask> {
  const assigneeId = input.assigneeId ?? reviewer.id;
  if (assigneeId !== reviewer.id && !can(reviewer, 'tasks:assign')) {
    return { ok: false, code: 'forbidden' };
  }
  if (
    !(await once(lookups.people, assigneeId, () =>
      isActiveReviewer(db, assigneeId),
    ))
  ) {
    return {
      ok: false,
      code: 'invalid_request',
      details: ['Esa persona no existe o ya no tiene acceso.'],
    };
  }
  const documentId = input.documentId;
  if (
    documentId &&
    !(await once(lookups.documents, documentId, () =>
      documentExists(db, documentId),
    ))
  ) {
    return {
      ok: false,
      code: 'invalid_request',
      details: ['Ese documento no existe.'],
    };
  }
  return { ok: true, task: { ...input, assigneeId } };
}
