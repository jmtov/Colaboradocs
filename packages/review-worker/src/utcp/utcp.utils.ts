import {
  MAX_TASK_BATCH,
  MAX_TASK_TITLE_LENGTH,
  type Permission,
  ROLE_PERMISSIONS,
} from '@colaboradocs/review-core';
import { MANUAL_VERSION, TOKEN_AUTH, UTCP_VERSION } from './utcp.constants';
import type {
  JsonSchema,
  UtcpHttpCallTemplate,
  UtcpManual,
  UtcpTool,
} from './utcp.types';

/** Una herramienta con el permiso que exige (null: no pide sesión). */
type ToolEntry = { permission: Permission | null; tool: UtcpTool };

const DATE = 'AAAA-MM-DD, un día sin hora ni zona.';
const OBJECT: JsonSchema = { type: 'object' };

function string(description: string): JsonSchema {
  return { type: 'string', description };
}

function inputs(
  properties: Record<string, JsonSchema>,
  required: string[] = [],
): JsonSchema {
  return { type: 'object', properties, required };
}

function tool(
  name: string,
  permission: Permission | null,
  description: string,
  tags: string[],
  io: { inputs: JsonSchema; outputs: JsonSchema },
  call: Omit<UtcpHttpCallTemplate, 'call_template_type' | 'auth'> & {
    authenticated?: boolean;
  },
): ToolEntry {
  const { authenticated = true, ...template } = call;
  return {
    permission,
    tool: {
      name,
      description,
      tags: permission ? [...tags, permission] : tags,
      ...io,
      tool_call_template: {
        call_template_type: 'http',
        ...template,
        ...(authenticated ? { auth: TOKEN_AUTH } : {}),
      },
    },
  };
}

/**
 * Todas las herramientas posibles, cada una con el permiso que exige. El manual solo
 * anuncia las que tiene el rol «agente» (`ROLE_PERMISSIONS`): dar o quitar un permiso
 * en review-core cambia el manual solo. Una prueba lo comprueba contra las rutas reales.
 */
export function buildToolEntries(origin: string): ToolEntry[] {
  const api = `${origin}/api`;
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
      'login',
      null,
      'Canjea el PIN del agente por un token (dura 30 días). Guárdalo en la variable COLABORADOCS_TOKEN.',
      ['acceso'],
      {
        inputs: inputs(
          {
            login: {
              type: 'object',
              properties: {
                pin: string('PIN de 8 caracteres, con o sin guion.'),
                deviceId: string(
                  'Identificador estable de este agente (16 a 64 letras, números o guiones).',
                ),
              },
              required: ['pin', 'deviceId'],
            },
          },
          ['login'],
        ),
        outputs: inputs({ token: string('El token.'), reviewer: OBJECT }),
      },
      {
        url: `${api}/login`,
        http_method: 'POST',
        content_type: 'application/json',
        body_field: 'login',
        authenticated: false,
      },
    ),
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
    tool(
      'list_documents',
      'documents:read',
      'Documentos de revisión (no archivados), con su actividad y su `tipo` (acta, iniciativa, guia u otro), `date` (de elaboración; null si no la tiene), `responsable` y `participantes`.',
      ['documentos'],
      { inputs: inputs({}), outputs: { type: 'array', items: OBJECT } },
      { url: `${api}/documents`, http_method: 'GET' },
    ),
    tool(
      'read_document',
      'documents:read',
      'El contenido completo de un documento publicado.',
      ['documentos'],
      {
        inputs: inputs({ documentId: string('Id del documento.') }, [
          'documentId',
        ]),
        outputs: OBJECT,
      },
      { url: `${api}/documents/{documentId}/content`, http_method: 'GET' },
    ),
    tool(
      'get_document_draft',
      'documents:draft',
      'El borrador de un documento (404 si no hay). Trae `revision`, que hay que devolver al guardar.',
      ['documentos', 'borradores'],
      {
        inputs: inputs({ documentId: string('Id del documento.') }, [
          'documentId',
        ]),
        outputs: OBJECT,
      },
      { url: `${api}/admin/documents/{documentId}/draft`, http_method: 'GET' },
    ),
    tool(
      'save_document_draft',
      'documents:draft',
      'Guarda el borrador de un documento (nuevo o existente). No lo publica (ver publish_document). Falla con 409 si el borrador cambió desde la `revision` que se pasa.',
      ['documentos', 'borradores'],
      {
        inputs: inputs(
          {
            documentId: string(
              'Id del documento (igual al `id` del contenido).',
            ),
            draft: {
              type: 'object',
              properties: {
                content: {
                  type: 'object',
                  description:
                    'El documento completo (id, title, version, updated, sections…). Opcionales: `tipo` (acta, iniciativa, guia u otro; la home lo rotula y filtra por él), `date` (AAAA-MM-DD: cuándo se elaboró; en un acta, el día de la reunión), `responsable` (iniciativas) y `participantes` (actas, nombres separados por coma). Formato en README.',
                },
                expectedRevision: {
                  type: 'integer',
                  description:
                    'La `revision` del borrador actual; 0 si no hay.',
                },
              },
              required: ['content', 'expectedRevision'],
            },
          },
          ['documentId', 'draft'],
        ),
        outputs: OBJECT,
      },
      {
        url: `${api}/admin/documents/{documentId}/draft`,
        http_method: 'PUT',
        content_type: 'application/json',
        body_field: 'draft',
      },
    ),
    tool(
      'publish_document',
      'documents:publish',
      'Publica el borrador de un documento: pasa a ser la versión vigente que ve el equipo. Si el documento ya existía, REEMPLAZA su versión (la anterior queda en versiones) y los comentarios y OK de los párrafos que cambien dejan de aplicar. Solo funciona si el último guardado del borrador fue del agente (si un admin lo tocó después, lo publica un admin) y no admite forzar: si el documento cambió desde que se creó el borrador, falla con 409 `draft_stale` y decide un admin. Presentaciones no se publican por aquí.',
      ['documentos', 'borradores'],
      {
        inputs: inputs(
          {
            documentId: string('Id del documento.'),
            publish: {
              type: 'object',
              properties: {
                expectedRevision: {
                  type: 'integer',
                  description:
                    'La `revision` del borrador que se quiere publicar (get_document_draft).',
                },
              },
              required: ['expectedRevision'],
            },
          },
          ['documentId', 'publish'],
        ),
        outputs: inputs({ created: { type: 'boolean' } }),
      },
      {
        url: `${api}/admin/documents/{documentId}/publish`,
        http_method: 'POST',
        content_type: 'application/json',
        body_field: 'publish',
      },
    ),
    tool(
      'list_decks',
      'decks:read',
      'Presentaciones (no archivadas), con su tema y si tienen borrador.',
      ['presentaciones'],
      { inputs: inputs({}), outputs: { type: 'array', items: OBJECT } },
      { url: `${api}/decks`, http_method: 'GET' },
    ),
    tool(
      'read_deck',
      'decks:read',
      'Una presentación publicada: el deck, su tema y la lista de archivos.',
      ['presentaciones'],
      {
        inputs: inputs({ deckId: string('Id de la presentación.') }, [
          'deckId',
        ]),
        outputs: OBJECT,
      },
      { url: `${api}/decks/{deckId}`, http_method: 'GET' },
    ),
    tool(
      'list_themes',
      'decks:read',
      'Los temas disponibles (colores, categorías, fuentes) con los que se dibuja un deck.',
      ['presentaciones'],
      { inputs: inputs({}), outputs: { type: 'array', items: OBJECT } },
      { url: `${api}/themes`, http_method: 'GET' },
    ),
    tool(
      'get_deck_draft',
      'decks:draft',
      'El borrador de una presentación (404 si no hay borrador o el deck no existe).',
      ['presentaciones', 'borradores'],
      {
        inputs: inputs({ deckId: string('Id de la presentación.') }, [
          'deckId',
        ]),
        outputs: OBJECT,
      },
      { url: `${api}/admin/decks/{deckId}/draft`, http_method: 'GET' },
    ),
    tool(
      'save_deck_draft',
      'decks:draft',
      'Guarda el borrador de una presentación que YA existe (404 si no; crearla es de admins). Reemplaza el borrador que hubiera, sin control de revisión: lee antes con get_deck_draft para no pisar el trabajo de otra persona. No se valida hasta publicar, y publicar es de admins.',
      ['presentaciones', 'borradores'],
      {
        inputs: inputs(
          {
            deckId: string('Id de la presentación (igual al `id` del deck).'),
            deck: {
              type: 'object',
              description:
                'El deck completo: `id`, `theme`, `title` y `slides[]`. Esquema en packages/deck-core/ESQUEMA.md.',
              properties: {
                id: string('Igual a deckId.'),
                slides: { type: 'array', items: OBJECT },
              },
              required: ['id', 'slides'],
            },
          },
          ['deckId', 'deck'],
        ),
        outputs: OBJECT,
      },
      {
        url: `${api}/admin/decks/{deckId}/draft`,
        http_method: 'PUT',
        content_type: 'application/json',
        body_field: 'deck',
      },
    ),
  ];
}

/** Las herramientas que el rol agente puede usar. */
export function buildTools(origin: string): UtcpTool[] {
  return buildToolEntries(origin)
    .filter(
      (entry) =>
        entry.permission === null ||
        ROLE_PERMISSIONS.agent.includes(entry.permission),
    )
    .map((entry) => entry.tool);
}

export function buildManual(origin: string): UtcpManual {
  return {
    utcp_version: UTCP_VERSION,
    manual_version: MANUAL_VERSION,
    info: {
      title: 'Colaboradocs',
      version: MANUAL_VERSION,
      description:
        'Revisión de documentos y presentaciones. Un agente entra con su PIN (login), guarda el token en COLABORADOCS_TOKEN y puede leer, crear y editar tareas, guardar borradores de documentos y presentaciones y publicar documentos; no publica presentaciones, ni archiva ni gestiona accesos.',
    },
    tools: buildTools(origin),
  };
}
