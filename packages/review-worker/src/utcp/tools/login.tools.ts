import { inputs, string, tool } from '../tool.utils';
import { OBJECT } from '../utcp.constants';
import type { ToolEntry } from '../utcp.types';

/** Entrar con el PIN del agente. */
export function loginTools(api: string): ToolEntry[] {
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
  ];
}
