import { inputs, string, tool } from '../tool.utils';
import { OBJECT } from '../utcp.constants';
import type { ToolEntry } from '../utcp.types';

/** Presentaciones y temas: leer y guardar borradores. */
export function deckTools(api: string): ToolEntry[] {
  return [
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
