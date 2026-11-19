/** Una tarea asignada a una persona, con fecha límite; puede colgar de un documento y de un bloque. */
export type Task = {
  id: string;
  title: string;
  documentId: string | null;
  /** El título del documento, para mostrarlo sin pedirlo aparte; null si no cuelga de uno. */
  documentTitle: string | null;
  blockId: string | null;
  assigneeId: string;
  assigneeName: string;
  assigneeMunicipality: string | null;
  /** AAAA-MM-DD: un día, sin hora ni zona. */
  dueDate: string;
  /** Cuándo se marcó hecha; null mientras está pendiente. */
  doneAt: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
};

export type NewTask = {
  title: string;
  dueDate: string;
  /** A quién se asigna; sin esto, a quien la crea. Asignar a otra persona es de admins. */
  assigneeId?: string;
  documentId?: string | null;
  /** Solo con `documentId`. */
  blockId?: string | null;
};

/** Cambios sobre una tarea; lo que no viene no se toca. */
export type TaskPatch = {
  done?: boolean;
  title?: string;
  dueDate?: string;
  assigneeId?: string;
};

/** Una persona a quien se puede asignar una tarea. */
export type TaskPerson = {
  id: string;
  name: string;
  municipality: string | null;
};

/** Cómo se agrupan las tareas en pantalla. */
export type TaskGroupKey = 'overdue' | 'week' | 'later' | 'done';

export type TaskGroup = { key: TaskGroupKey; tasks: Task[] };

/** Qué tan cerca está una tarea de su fecha, para ordenarla y colorearla. */
export type DueState = 'done' | 'overdue' | 'today' | 'soon' | 'later';
