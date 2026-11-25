import { isIsoDate } from '../shared/date.utils';
import { MAX_TASK_BATCH, MAX_TASK_TITLE_LENGTH } from './task.constants';
import type {
  DueState,
  NewTask,
  Task,
  TaskGroup,
  TaskGroupKey,
  TaskPatch,
} from './task.types';

const DOCUMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const BLOCK_ID_PATTERN = /^[a-z0-9-]{1,100}$/;
const SOON_DAYS = 7;
const DAY_MS = 86_400_000;

export type TaskValidation<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

function checkTitle(value: unknown, errors: string[]): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push('Falta el título de la tarea.');
    return undefined;
  }
  const title = value.trim();
  if (title.length > MAX_TASK_TITLE_LENGTH) {
    errors.push(`El título pasa de ${MAX_TASK_TITLE_LENGTH} caracteres.`);
    return undefined;
  }
  return title;
}

function checkId(
  value: unknown,
  pattern: RegExp,
  label: string,
  errors: string[],
): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !pattern.test(value)) {
    errors.push(`«${label}» no es válido.`);
    return undefined;
  }
  return value;
}

/** Valida y limpia lo que llega para crear una tarea. */
export function validateNewTask(input: unknown): TaskValidation<NewTask> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: ['La tarea tiene que ser un objeto.'] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  const title = checkTitle(raw.title, errors);
  if (!isIsoDate(raw.dueDate))
    errors.push('La fecha tiene que ser AAAA-MM-DD.');
  const documentId = checkId(
    raw.documentId,
    DOCUMENT_ID_PATTERN,
    'documentId',
    errors,
  );
  const blockId = checkId(raw.blockId, BLOCK_ID_PATTERN, 'blockId', errors);
  if (blockId && !documentId) {
    errors.push('Un bloque necesita su documento.');
  }
  if (raw.assigneeId !== undefined && typeof raw.assigneeId !== 'string') {
    errors.push('«assigneeId» no es válido.');
  }
  if (errors.length > 0 || title === undefined || !isIsoDate(raw.dueDate)) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      title,
      dueDate: raw.dueDate,
      ...(typeof raw.assigneeId === 'string' && raw.assigneeId
        ? { assigneeId: raw.assigneeId }
        : {}),
      documentId: documentId ?? null,
      blockId: blockId ?? null,
    },
  };
}

/** Valida un lote: `{ tasks: [...] }`. Todo o nada: un error en una tarea rechaza el lote, y cada error dice cuál. */
export function validateNewTasks(input: unknown): TaskValidation<NewTask[]> {
  const list =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>).tasks
      : undefined;
  if (!Array.isArray(list) || list.length === 0) {
    return {
      ok: false,
      errors: ['«tasks» tiene que ser una lista con tareas.'],
    };
  }
  if (list.length > MAX_TASK_BATCH) {
    return {
      ok: false,
      errors: [`Un lote admite hasta ${MAX_TASK_BATCH} tareas.`],
    };
  }
  const errors: string[] = [];
  const tasks: NewTask[] = [];
  list.forEach((item, index) => {
    const checked = validateNewTask(item);
    if (checked.ok) tasks.push(checked.value);
    else {
      for (const error of checked.errors) {
        errors.push(`Tarea ${index + 1}: ${error}`);
      }
    }
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: tasks };
}

/** Valida y limpia los cambios a una tarea; al menos uno. */
export function validateTaskPatch(input: unknown): TaskValidation<TaskPatch> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: ['Los cambios tienen que ser un objeto.'] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  const patch: TaskPatch = {};
  if (raw.done !== undefined) {
    if (typeof raw.done === 'boolean') patch.done = raw.done;
    else errors.push('«done» tiene que ser verdadero o falso.');
  }
  if (raw.title !== undefined) {
    const title = checkTitle(raw.title, errors);
    if (title !== undefined) patch.title = title;
  }
  if (raw.dueDate !== undefined) {
    if (isIsoDate(raw.dueDate)) patch.dueDate = raw.dueDate;
    else errors.push('La fecha tiene que ser AAAA-MM-DD.');
  }
  if (raw.assigneeId !== undefined) {
    if (typeof raw.assigneeId === 'string' && raw.assigneeId) {
      patch.assigneeId = raw.assigneeId;
    } else {
      errors.push('«assigneeId» no es válido.');
    }
  }
  for (const [key, pattern, label] of [
    ['documentId', DOCUMENT_ID_PATTERN, 'documentId'],
    ['blockId', BLOCK_ID_PATTERN, 'blockId'],
  ] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (value === null) patch[key] = null;
    else if (typeof value === 'string' && pattern.test(value))
      patch[key] = value;
    else errors.push(`«${label}» no es válido.`);
  }
  if (patch.documentId === null && typeof patch.blockId === 'string') {
    errors.push('Un bloque necesita su documento.');
  }
  if (errors.length === 0 && Object.keys(patch).length === 0) {
    errors.push('No hay nada que cambiar.');
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: patch };
}

/** Qué tan cerca está la tarea de su fecha, respecto de `today` (AAAA-MM-DD). */
export function dueState(
  task: Pick<Task, 'dueDate' | 'doneAt'>,
  today: string,
): DueState {
  if (task.doneAt !== null) return 'done';
  if (task.dueDate < today) return 'overdue';
  if (task.dueDate === today) return 'today';
  const days =
    (Date.parse(`${task.dueDate}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
    DAY_MS;
  return days <= SOON_DAYS ? 'soon' : 'later';
}

/** Primero las pendientes, por fecha (y por creación); después las hechas, las más recientes primero. */
export function compareTasks(a: Task, b: Task): number {
  if ((a.doneAt === null) !== (b.doneAt === null)) {
    return a.doneAt === null ? -1 : 1;
  }
  if (a.doneAt !== null && b.doneAt !== null) {
    return b.doneAt.localeCompare(a.doneAt);
  }
  return (
    a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt)
  );
}

const GROUP_OF: Record<DueState, TaskGroupKey> = {
  overdue: 'overdue',
  today: 'week',
  soon: 'week',
  later: 'later',
  done: 'done',
};
const GROUP_ORDER: TaskGroupKey[] = ['overdue', 'week', 'later', 'done'];

/** Las tareas ordenadas y repartidas en vencidas, de esta semana, más adelante y hechas (sin grupos vacíos). */
export function groupTasks(tasks: Task[], today: string): TaskGroup[] {
  const sorted = [...tasks].sort(compareTasks);
  return GROUP_ORDER.map((key) => ({
    key,
    tasks: sorted.filter((task) => GROUP_OF[dueState(task, today)] === key),
  })).filter((group) => group.tasks.length > 0);
}
