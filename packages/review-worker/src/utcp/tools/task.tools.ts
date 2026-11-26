import {
  MAX_TASK_BATCH,
  MAX_TASK_TITLE_LENGTH,
} from '@colaboradocs/review-core';
import { inputs, string, tool } from '../tool.utils';
import { DATE, OBJECT } from '../utcp.constants';
import type { ToolEntry } from '../utcp.types';

/** Tareas y las personas a quienes asignarlas. */
export function taskTools(api: string): ToolEntry[] {
  const taskFields = {
    title: string(
      `Qué hay que hacer (máx. ${MAX_TASK_TITLE_LENGTH} caracteres).`,
    ),
    dueDate: string(`Fecha límite. ${DATE}`),
    assigneeId: string(
      'Id de la persona a quien se asigna (ver list_people). Sin esto, queda para el agente.',
    ),
    documentId: string('Id del documento del que cuelga (opcional).'),
    blockId: string('Id del bloque; solo con documentId (opcional).'),
  };
  return [
    tool(
      'list_people',
      'tasks:own',
      'Personas a quienes se puede asignar una tarea.',
      ['tareas'],
      {
        inputs: inputs({}),
        outputs: { type: 'array', items: OBJECT },
      },
      { url: `${api}/tasks/people`, http_method: 'GET' },
    ),
    tool(
      'list_tasks',
      'tasks:own',
      'Lista tareas. Con `scope: all`, las de todos; con `document`, las de ese documento.',
      ['tareas'],
      {
        inputs: inputs({
          scope: {
            type: 'string',
            enum: ['mine', 'all'],
            description: 'Por omisión, las del agente.',
          },
          document: string(
            'Id de un documento: sus tareas, de todas las personas.',
          ),
        }),
        outputs: { type: 'array', items: OBJECT },
      },
      { url: `${api}/tasks`, http_method: 'GET' },
    ),
    tool(
      'create_task',
      'tasks:own',
      'Crea una tarea con fecha límite y la asigna a una persona.',
      ['tareas'],
      {
        inputs: inputs(
          {
            task: {
              type: 'object',
              properties: taskFields,
              required: ['title', 'dueDate'],
            },
          },
          ['task'],
        ),
        outputs: OBJECT,
      },
      {
        url: `${api}/tasks`,
        http_method: 'POST',
        content_type: 'application/json',
        body_field: 'task',
      },
    ),
    tool(
      'create_tasks',
      'tasks:own',
      `Crea varias tareas de una vez (hasta ${MAX_TASK_BATCH}). Todo o nada: si una no es válida no se crea ninguna y el error dice cuál. Devuelve las tareas creadas, en el mismo orden.`,
      ['tareas'],
      {
        inputs: inputs(
          {
            batch: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  description: `Entre 1 y ${MAX_TASK_BATCH} tareas, con los mismos campos que create_task.`,
                  items: {
                    type: 'object',
                    properties: taskFields,
                    required: ['title', 'dueDate'],
                  },
                },
              },
              required: ['tasks'],
            },
          },
          ['batch'],
        ),
        outputs: { type: 'array', items: OBJECT },
      },
      {
        url: `${api}/tasks/batch`,
        http_method: 'POST',
        content_type: 'application/json',
        body_field: 'batch',
      },
    ),
    tool(
      'update_task',
      'tasks:own',
      'Cambia el título, la fecha o el documento de una tarea que creó el agente, o marca hecha una que tiene asignada (`done` solo lo puede quien la tiene). Pasarla a otra persona es de admins.',
      ['tareas'],
      {
        inputs: inputs(
          {
            id: string('Id de la tarea.'),
            changes: {
              type: 'object',
              properties: {
                done: {
                  type: 'boolean',
                  description:
                    'Marcar hecha o pendiente; solo si la tarea es del agente.',
                },
                title: taskFields.title,
                dueDate: taskFields.dueDate,
                documentId: {
                  type: ['string', 'null'],
                  description:
                    'Asociarla a un documento publicado, o null para soltarla. Al cambiar de documento se suelta el bloque.',
                },
                blockId: {
                  type: ['string', 'null'],
                  description: 'Bloque del documento (opcional), o null.',
                },
              },
            },
          },
          ['id', 'changes'],
        ),
        outputs: OBJECT,
      },
      {
        url: `${api}/tasks/{id}`,
        http_method: 'PATCH',
        content_type: 'application/json',
        body_field: 'changes',
      },
    ),
  ];
}
