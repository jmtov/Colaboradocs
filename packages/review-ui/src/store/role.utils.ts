/** Cómo se llama y se muestra el rol de cada persona (en la Juntanza, su municipio). */
export type RoleField = {
  /** Nombre del campo en formularios: «Municipio», «Área»… Por defecto «Rol». */
  label: string;
  /** Plantilla para mostrarlo en la lista de accesos: «Representante {value}». */
  format?: string;
};

export const DEFAULT_ROLE_FIELD: RoleField = { label: 'Rol' };

/** El valor guardado -> cómo se muestra. Sin plantilla, tal cual. */
export function formatRole(field: RoleField, value: string): string {
  return field.format ? field.format.replace('{value}', value) : value;
}
