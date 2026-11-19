import type {
  NewTask,
  Task,
  TaskPatch,
  TaskPerson,
} from '@colaboradocs/review-core';

type TaskRow = {
  id: string;
  title: string;
  document_id: string | null;
  document_title: string | null;
  block_id: string | null;
  assignee_id: string;
  assignee_name: string;
  assignee_municipality: string | null;
  due_date: string;
  done_at: string | null;
  created_by: string;
  creator_name: string;
  created_at: string;
};

const TASK_SELECT = `
  SELECT t.id, t.title, t.document_id, d.title AS document_title, t.block_id,
         t.assignee_id, a.name AS assignee_name, a.municipality AS assignee_municipality,
         t.due_date, t.done_at, t.created_by, c.name AS creator_name, t.created_at
  FROM tasks t
  JOIN reviewers a ON a.id = t.assignee_id
  JOIN reviewers c ON c.id = t.created_by
  LEFT JOIN documents d ON d.id = t.document_id AND d.archived_at IS NULL`;

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    documentId: row.document_id,
    documentTitle: row.document_title,
    blockId: row.block_id,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    assigneeMunicipality: row.assignee_municipality,
    dueDate: row.due_date,
    doneAt: row.done_at,
    createdById: row.created_by,
    createdByName: row.creator_name,
    createdAt: row.created_at,
  };
}

export type TaskFilter = { assigneeId?: string; documentId?: string };

/** Las tareas que cumplen el filtro (sin filtro, todas), pendientes primero y por fecha. */
export async function listTasks(
  db: D1Database,
  filter: TaskFilter,
): Promise<Task[]> {
  const where: string[] = [];
  const values: string[] = [];
  if (filter.assigneeId) {
    where.push('t.assignee_id = ?');
    values.push(filter.assigneeId);
  }
  if (filter.documentId) {
    where.push('t.document_id = ?');
    values.push(filter.documentId);
  }
  const { results } = await db
    .prepare(
      `${TASK_SELECT} ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY (t.done_at IS NOT NULL), t.due_date, t.created_at`,
    )
    .bind(...values)
    .all<TaskRow>();
  return results.map(toTask);
}

export async function findTask(
  db: D1Database,
  id: string,
): Promise<Task | null> {
  const row = await db
    .prepare(`${TASK_SELECT} WHERE t.id = ?`)
    .bind(id)
    .first<TaskRow>();
  return row ? toTask(row) : null;
}

/** ¿Existe esa persona y sigue con acceso? Solo a ellas se les asignan tareas. */
export async function isActiveReviewer(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      'SELECT 1 AS found FROM reviewers WHERE id = ? AND revoked_at IS NULL',
    )
    .bind(id)
    .first();
  return row !== null;
}

export async function documentExists(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      'SELECT 1 AS found FROM documents WHERE id = ? AND archived_at IS NULL',
    )
    .bind(id)
    .first();
  return row !== null;
}

export async function insertTask(
  db: D1Database,
  task: NewTask & { assigneeId: string },
  createdBy: string,
  id: string,
  nowIso: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tasks (id, title, document_id, block_id, assignee_id, due_date, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      task.title,
      task.documentId ?? null,
      task.blockId ?? null,
      task.assigneeId,
      task.dueDate,
      createdBy,
      nowIso,
    )
    .run();
}

/** Aplica los cambios que vienen; `done` pone o quita la fecha de cierre. */
export async function updateTask(
  db: D1Database,
  id: string,
  patch: TaskPatch,
  nowIso: string,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (patch.title !== undefined) {
    sets.push('title = ?');
    values.push(patch.title);
  }
  if (patch.dueDate !== undefined) {
    sets.push('due_date = ?');
    values.push(patch.dueDate);
  }
  if (patch.assigneeId !== undefined) {
    sets.push('assignee_id = ?');
    values.push(patch.assigneeId);
  }
  if (patch.done !== undefined) {
    sets.push('done_at = ?');
    values.push(patch.done ? nowIso : null);
  }
  if (sets.length === 0) return;
  await db
    .prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteTask(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
}

/** Las personas con acceso, para elegir a quién asignar una tarea. */
export async function listAssignablePeople(
  db: D1Database,
): Promise<TaskPerson[]> {
  const { results } = await db
    .prepare(
      'SELECT id, name, municipality FROM reviewers WHERE revoked_at IS NULL ORDER BY name',
    )
    .all<TaskPerson>();
  return results;
}
