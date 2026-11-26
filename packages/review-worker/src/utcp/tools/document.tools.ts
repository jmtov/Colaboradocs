import { inputs, string, tool } from '../tool.utils';
import { OBJECT } from '../utcp.constants';
import type { ToolEntry } from '../utcp.types';

/** Documentos: leer, guardar borradores y publicar. */
export function documentTools(api: string): ToolEntry[] {
  return [
    tool(
      'list_documents',
      'documents:read',
      'Documentos de revisión (no archivados), con su actividad y su `type` (minutes, initiative, guide u other), `date` (de elaboración; null si no la tiene), `owner` y `attendees`.',
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
                    'El documento completo (id, title, version, updated, sections…). Opcionales: `type` (minutes, initiative, guide u other; la home lo rotula y filtra por él), `date` (AAAA-MM-DD: cuándo se elaboró; en un acta, el día de la reunión), `owner` (iniciativas) y `attendees` (actas, nombres separados por coma). Formato en README.',
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
  ];
}
