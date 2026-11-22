export interface SelectOption {
  value: string;
  label: string;
}

interface FieldBase {
  /** Clave dentro del objeto que describe (`title`, `eyebrow.text`…). */
  key: string;
  label: string;
  /** Sin este campo el elemento no es válido; un formulario no lo deja vacío ni lo quita. */
  required?: boolean;
  help?: string;
  /** Título de la tarjeta de filas en que se muestra: los campos de un solo valor seguidos con el mismo grupo van juntos. */
  group?: string;
}

/**
 * Describe un campo del esquema para quien lo edita: qué tipo de control lleva, cómo se llama y con
 * qué valor arranca. Es la misma verdad para el formulario, los valores de prueba y las pruebas
 * que comprueban que el renderizador dibuja lo que el esquema promete.
 */
export type Field =
  | (FieldBase & {
      type: 'text' | 'longtext' | 'icon' | 'datetime' | 'asset';
      sample?: string;
      /** El texto tiene un formato (hora, fecha, proporción, nombre de componente): los casos de prueba no lo alargan ni lo acortan. */
      keep?: boolean;
    })
  | (FieldBase & { type: 'number'; min?: number; sample?: number })
  | (FieldBase & {
      type: 'boolean';
      /** Valor cuando el campo no está en los datos (se muestra así y el renderizador lo toma igual). */
      default?: boolean;
    })
  | (FieldBase & {
      type: 'select';
      options: SelectOption[];
      /** El valor es un número (`columns: 3`) y no un texto. */
      numeric?: boolean;
      sample?: string;
    })
  | (FieldBase & { type: 'category' })
  /** Dónde cae un bloque en la cuadrícula de su slide: guarda `col`, `row`, `span` y `rowSpan`. */
  | (FieldBase & { type: 'position' })
  /** El tamaño de la cuadrícula de la slide: guarda `columns` y `rows`. */
  | (FieldBase & { type: 'gridsize' })
  /** Un texto por línea (el título). */
  | (FieldBase & { type: 'lines'; sample?: string[] })
  /** Un objeto con sus propios campos (el eyebrow, una persona). */
  | (FieldBase & { type: 'object'; fields: Field[] })
  /** Una lista de objetos del mismo tipo. */
  | (FieldBase & {
      type: 'list';
      itemLabel: string;
      fields: Field[];
      /** Ítems con los que arranca una lista nueva. */
      sample: Record<string, unknown>[];
    })
  | (FieldBase & { type: 'people' })
  /** Los bloques de contenido de la slide. */
  | (FieldBase & { type: 'blocks' });

export type FieldType = Field['type'];

export interface Descriptor {
  label: string;
  fields: Field[];
}

/** Casos para probar un layout con otros textos: ver `applyTestCase`. */
export type TestCaseId = 'short' | 'long' | 'many' | 'minimal';
