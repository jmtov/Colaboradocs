import type {
  DocumentListItem,
  NewTask,
  Task,
  TaskPatch,
  TaskPerson,
} from '@colaboradocs/review-core';
import type { SheetLayerProps } from '@colaboradocs/review-ui';

/**
 * Crear una tarea (resuelve con la tarea nueva) o, con `task`, editar una que ya existe
 * (resuelve con solo lo que cambió); sin resultado si se cancela o no se cambió nada.
 */
export type NewTaskSheetProps = SheetLayerProps<NewTask | TaskPatch> & {
  /** La tarea que se edita; sin esto, se crea una nueva. */
  task?: Task;
  documents: DocumentListItem[];
  /** Solo admins asignan a otras personas; quien no, no ve el selector. */
  people: TaskPerson[];
  meId: string;
  /** El día de hoy (AAAA-MM-DD): la fecha no puede ser anterior. */
  today: string;
  /** Documento preseleccionado (el filtro de la lista), si lo hay. */
  documentId?: string;
  /** El documento ya está dado (se crea desde su editor): no se muestra el selector. */
  documentLocked?: boolean;
};
