import type { Permission } from '@colaboradocs/review-core';
import { TOKEN_AUTH } from './utcp.constants';
import type { JsonSchema, ToolEntry, UtcpHttpCallTemplate } from './utcp.types';

export function string(description: string): JsonSchema {
  return { type: 'string', description };
}

export function inputs(
  properties: Record<string, JsonSchema>,
  required: string[] = [],
): JsonSchema {
  return { type: 'object', properties, required };
}

export function tool(
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
