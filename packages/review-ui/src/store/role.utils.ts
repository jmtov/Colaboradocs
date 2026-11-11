import type { RoleField } from '@colaboradocs/review-core';

export type { RoleField };

export const DEFAULT_ROLE_FIELD: RoleField = { label: 'Rol' };

/** El valor guardado -> cómo se muestra. Sin plantilla, tal cual. */
export function formatRole(field: RoleField, value: string): string {
  return field.format ? field.format.replace('{value}', value) : value;
}
