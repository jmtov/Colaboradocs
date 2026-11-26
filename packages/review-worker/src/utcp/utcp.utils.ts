import { ROLE_PERMISSIONS } from '@colaboradocs/review-core';
import { deckTools } from './tools/deck.tools';
import { documentTools } from './tools/document.tools';
import { loginTools } from './tools/login.tools';
import { taskTools } from './tools/task.tools';
import { MANUAL_VERSION, UTCP_VERSION } from './utcp.constants';
import type { ToolEntry, UtcpManual, UtcpTool } from './utcp.types';

/**
 * Todas las herramientas posibles, cada una con el permiso que exige. El manual solo
 * anuncia las que tiene el rol «agente» (`ROLE_PERMISSIONS`): dar o quitar un permiso
 * en review-core cambia el manual solo. Una prueba lo comprueba contra las rutas reales.
 */
export function buildToolEntries(origin: string): ToolEntry[] {
  const api = `${origin}/api`;
  return [
    ...loginTools(api),
    ...taskTools(api),
    ...documentTools(api),
    ...deckTools(api),
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
