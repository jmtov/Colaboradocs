import type { Field } from '@colaboradocs/deck-core';

/**
 * Lo que se guarda en el deck al escribir en un campo: un campo opcional vacío no se guarda (el
 * JSON queda limpio), los números y las opciones numéricas son números, y el título son líneas.
 */
export function toStoredValue(field: Field, raw: string | boolean): unknown {
  switch (field.type) {
    case 'boolean':
      // lo que coincide con el valor por omisión no se guarda; si el valor por omisión es «sí», apagarlo sí
      return raw === (field.default ?? false) ? undefined : raw === true;
    case 'number': {
      if (raw === '') return undefined;
      const n = Number(raw);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'select':
      if (raw === '') return undefined;
      return field.numeric ? Number(raw) : raw;
    case 'category':
      return raw === '' ? undefined : Number(raw);
    case 'lines':
      return String(raw).split('\n');
    default:
      return raw === '' && !field.required ? undefined : raw;
  }
}

/** Cómo se muestra el valor guardado en su control. */
export function toDisplayValue(field: Field, stored: unknown): string {
  if (stored === undefined || stored === null) return '';
  if (field.type === 'lines')
    return Array.isArray(stored) ? stored.join('\n') : '';
  return String(stored);
}

const ROW_TYPES: readonly Field['type'][] = [
  'text',
  'longtext',
  'number',
  'boolean',
  'select',
  'icon',
  'category',
  'datetime',
  'asset',
  'lines',
];

export type FieldGroup =
  | { kind: 'rows'; title?: string; fields: Field[] }
  | { kind: 'section'; field: Field };

/**
 * Parte los campos en bloques para mostrarlos: los campos de un solo valor consecutivos que son del
 * mismo grupo van juntos en una tarjeta de filas (etiqueta a la izquierda, valor a la derecha), con
 * el título del grupo; un grupo de campos, una lista o los bloques de un hueco son cada uno su
 * propia sección, con su título.
 */
export function groupFields(fields: Field[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  for (const field of fields) {
    if (!ROW_TYPES.includes(field.type)) {
      groups.push({ kind: 'section', field });
      continue;
    }
    const last = groups.at(-1);
    if (last?.kind === 'rows' && last.title === field.group)
      last.fields.push(field);
    else groups.push({ kind: 'rows', title: field.group, fields: [field] });
  }
  return groups;
}
