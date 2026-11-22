import { SINGLE_BLOCK_KINDS } from './deck.constants';
import type {
  Block,
  BlockKind,
  ContentSlide,
  Slide,
  SlideKind,
} from './deck.types';
import {
  BLOCK_DESCRIPTORS,
  MANY_ITEMS,
  NOTES_GROUP,
  SLIDE_DESCRIPTORS,
  STYLE_GROUP,
} from './fields.constants';
import type { Field, TestCaseId } from './fields.types';
import { layoutContent } from './layout.utils';
import { SLIDE_TEMPLATES } from './templates.constants';

type Obj = Record<string, unknown>;

const clone = <T>(value: T): T => structuredClone(value);

function sampleOf(field: Field): unknown {
  switch (field.type) {
    case 'text':
    case 'longtext':
    case 'icon':
    case 'datetime':
    case 'asset':
      return field.sample ?? '';
    case 'number':
      return field.sample ?? field.min ?? 1;
    case 'boolean':
      return false;
    case 'select': {
      const value = field.sample ?? field.options[0]?.value ?? '';
      return field.numeric ? Number(value) : value;
    }
    case 'category':
      return 0;
    case 'lines':
      return clone(field.sample ?? ['']);
    case 'object':
      return defaultValue(field.fields);
    case 'list':
      return clone(field.sample);
    case 'people':
    case 'blocks':
      return [];
    case 'position':
    case 'gridsize':
      return undefined;
  }
}

/** Lo mínimo para que un elemento nuevo sea válido: los campos obligatorios con su valor de ejemplo. */
export function defaultValue(fields: Field[]): Obj {
  const out: Obj = {};
  for (const field of fields)
    if (field.required) out[field.key] = sampleOf(field);
  return out;
}

export function defaultBlock(kind: BlockKind): Block {
  return { kind, ...defaultValue(BLOCK_DESCRIPTORS[kind].fields) } as Block;
}

/** Una slide nueva: con un título de ejemplo y, si se pide, los valores de una plantilla. */
export function defaultSlide(templateId?: string): Slide {
  const template = SLIDE_TEMPLATES.find((t) => t.id === templateId);
  return {
    kind: 'content',
    body: [defaultBlock('heading')],
    ...clone(template?.slide ?? {}),
  } as Slide;
}

/** Los campos que describe un bloque o una slide ya existentes. */
export function fieldsOf(
  item: Block | Slide,
  scope: 'block' | 'slide',
): Field[] {
  return scope === 'block'
    ? BLOCK_DESCRIPTORS[item.kind as BlockKind].fields
    : SLIDE_DESCRIPTORS[item.kind as SlideKind].fields;
}

/**
 * Un elemento con **todos** sus campos llenos de textos únicos («‹ruta›»): sirve para comprobar que
 * el renderizador dibuja cada campo que el esquema promete.
 */
export function fullSample(fields: Field[], path: string): Obj {
  const out: Obj = {};
  for (const field of fields) {
    const at = `${path}.${field.key}`;
    switch (field.type) {
      case 'text':
      case 'longtext':
      case 'asset':
        out[field.key] = `«${at}»`;
        break;
      case 'icon':
        out[field.key] = 'info';
        break;
      case 'datetime':
        out[field.key] = field.sample ?? '2026-11-22T10:00:00-05:00';
        break;
      case 'number':
        out[field.key] = field.sample ?? field.min ?? 1;
        break;
      case 'boolean':
        out[field.key] = true;
        break;
      case 'select':
        out[field.key] = field.numeric
          ? Number(field.options.at(-1)?.value)
          : (field.options.at(-1)?.value ?? '');
        break;
      case 'category':
        out[field.key] = 0;
        break;
      case 'lines':
        out[field.key] = [`«${at}.0»`, `«${at}.1»`];
        break;
      case 'object':
        out[field.key] = fullSample(field.fields, at);
        break;
      case 'list':
        out[field.key] = [
          fullSample(field.fields, `${at}.0`),
          fullSample(field.fields, `${at}.1`),
        ];
        break;
      case 'people':
        out[field.key] = [{ name: `«${at}.0.name»`, role: `«${at}.0.role»` }];
        break;
      case 'blocks':
        out[field.key] = [];
        break;
      case 'position':
      case 'gridsize':
        break;
    }
  }
  return out;
}

const firstWord = (text: string) => text.trim().split(/\s+/)[0] ?? '';

function lengthen(text: string, target: number): string {
  if (!text || text.length >= target) return text;
  const repeats = Math.ceil(target / (text.length + 1));
  return Array.from({ length: repeats }, () => text).join(' ');
}

function transformList(
  value: unknown[],
  field: Extract<Field, { type: 'list' }>,
  id: TestCaseId,
): unknown[] {
  let items = value as Obj[];
  if (id === 'minimal') items = items.slice(0, 1);
  if (id === 'many' && items.length > 0) {
    items = Array.from({ length: Math.max(MANY_ITEMS, items.length) }, (_, i) =>
      clone(items[i % items.length] as Obj),
    );
  }
  for (const item of items) transformObject(item, field.fields, id);
  return items;
}

/**
 * Repite los bloques de la slide hasta llenar su cuadrícula (los clones se acomodan solos), sin pasarse:
 * en cuanto un clon ya no cabe, se queda con los que sí.
 */
function fillGrid(blocks: Block[], slide: ContentSlide): Block[] {
  // el título (y todo bloque único) no se repite
  const base = blocks
    .filter((b) => !SINGLE_BLOCK_KINDS.includes(b.kind))
    .map((b) => clone(b));
  if (base.length === 0) return blocks;
  const out = blocks.map((b) => clone(b));
  const columns = slide.columns ?? 1;
  for (let i = 0; i < columns * 4; i++) {
    const copy = clone(base[i % base.length] as Block);
    copy.col = undefined;
    copy.row = undefined;
    const trial = [...out, copy];
    if (layoutContent({ ...slide, body: trial }).issues.length > 0) break;
    out.push(copy);
  }
  return out;
}

function transformObject(obj: Obj, fields: Field[], id: TestCaseId) {
  for (const field of fields) {
    const value = obj[field.key];
    if (value === undefined) continue;
    if (id === 'minimal' && !field.required && field.key !== 'title') {
      delete obj[field.key];
      continue;
    }
    switch (field.type) {
      case 'text':
      case 'longtext':
        if (field.keep || typeof value !== 'string') break;
        if (id === 'short') obj[field.key] = firstWord(value);
        if (id === 'long')
          obj[field.key] = lengthen(
            value,
            field.type === 'longtext' ? 220 : 90,
          );
        break;
      case 'lines':
        if (!Array.isArray(value)) break;
        if (id === 'short')
          obj[field.key] = [firstWord(String(value[0] ?? ''))];
        if (id === 'long')
          obj[field.key] = [0, 1, 2].map((i) =>
            lengthen(String(value[i % value.length] ?? ''), 28),
          );
        break;
      case 'object':
        transformObject(value as Obj, field.fields, id);
        break;
      case 'list':
        obj[field.key] = transformList(value as unknown[], field, id);
        break;
      case 'blocks': {
        const blocks = value as Block[];
        if (id === 'many' && blocks.length > 0)
          obj[field.key] = fillGrid(blocks, obj as unknown as ContentSlide);
        for (const block of obj[field.key] as Block[]) {
          transformObject(
            block as unknown as Obj,
            BLOCK_DESCRIPTORS[block.kind].fields,
            id,
          );
        }
        break;
      }
      default:
        break;
    }
  }
}

/** Una copia de la slide con otros textos para probar el layout: corto, largo, con muchos elementos o mínimo. */
export function applyTestCase(slide: Slide, id: TestCaseId): Slide {
  const copy = clone(slide) as unknown as Obj;
  transformObject(copy, SLIDE_DESCRIPTORS[slide.kind].fields, id);
  return copy as unknown as Slide;
}

export type FieldPart = 'general' | 'content' | 'other';

export const PART_LABELS: Record<FieldPart, string> = {
  general: 'General',
  content: 'Contenido',
  other: 'Otros datos',
};

/** En cuál de las tres partes del panel va un campo de slide: el estilo es general, las notas son otros datos y lo demás es contenido. */
export function partOf(field: Field): FieldPart {
  if (field.group === STYLE_GROUP) return 'general';
  if (field.group === NOTES_GROUP) return 'other';
  return 'content';
}

/** Los campos de una slide agrupados por parte, en el orden en que aparecen. */
export function partsOf(
  fields: Field[],
): { part: FieldPart; fields: Field[] }[] {
  const parts: { part: FieldPart; fields: Field[] }[] = [];
  for (const field of fields) {
    const part = partOf(field);
    const last = parts.at(-1);
    if (last?.part === part) last.fields.push(field);
    else parts.push({ part, fields: [field] });
  }
  return parts;
}
