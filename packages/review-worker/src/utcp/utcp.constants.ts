import type { UtcpAuth } from './utcp.types';

/** Versión del formato UTCP que se emite (la que usan los ejemplos de utcp.io). */
export const UTCP_VERSION = '1.0.1';

/** Sube cuando cambia lo que anuncia el manual. */
export const MANUAL_VERSION = '1.0.0';

/** Variable que el cliente del agente rellena con el token que devuelve `login`. */
export const TOKEN_VARIABLE = 'COLABORADOCS_TOKEN';

export const TOKEN_AUTH: UtcpAuth = {
  auth_type: 'api_key',
  api_key: `Bearer \${${TOKEN_VARIABLE}}`,
  var_name: 'Authorization',
  location: 'header',
};
