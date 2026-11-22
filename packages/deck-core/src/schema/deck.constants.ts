/** Hay un solo tipo de slide: la de contenido (portada, sección, texto, cuadrícula…: solo cambia su disposición). */
export const SLIDE_KINDS = ['content'] as const;

export const BLOCK_KINDS = [
  'heading',
  'note',
  'list',
  'card',
  'person',
  'figure',
  'image',
  'qr',
  'countdown',
  'notice',
  'agenda',
  'timeline',
  'date-box',
  'chips',
  'custom',
] as const;

/** La cuadrícula de una slide: hasta 4 columnas y 4 filas. */
export const COLUMN_COUNTS = [1, 2, 3, 4] as const;
export const ROW_COUNTS = [1, 2, 3, 4] as const;
export const MAX_ROWS = 4;

/**
 * Cuántas columnas ocupa cada tipo de bloque: `fill` siempre todas; con `min`/`max` arranca en `min`
 * y se puede ensanchar hasta `max`.
 */
/** `wide`: sin pedir otra cosa, ocupa todas las columnas. */
export type SpanPolicy = 'fill' | { min: number; max: number; wide?: boolean };

/** Bloques que solo pueden aparecer una vez por slide. */
export const SINGLE_BLOCK_KINDS: readonly (typeof BLOCK_KINDS)[number][] = [
  'heading',
];
export const BLOCK_SPAN: Record<(typeof BLOCK_KINDS)[number], SpanPolicy> = {
  heading: { min: 1, max: 4, wide: true },
  note: { min: 1, max: 4 },
  list: { min: 1, max: 4 },
  card: { min: 1, max: 4 },
  person: { min: 1, max: 2 },
  figure: { min: 1, max: 4 },
  image: { min: 1, max: 4 },
  qr: { min: 1, max: 2 },
  'date-box': { min: 1, max: 2 },
  custom: { min: 1, max: 4 },
  countdown: { min: 1, max: 4 },
  notice: { min: 1, max: 4 },
  chips: { min: 1, max: 4 },
  agenda: 'fill',
  timeline: 'fill',
};

export const SLIDE_TONES = ['default', 'accent', 'inverse'] as const;
/** La densidad cambia la separación entre celdas (y, en compacta, el tamaño de listas y tarjetas). */
export const DENSITIES = ['normal', 'compact', 'spacious'] as const;
export const AGENDA_MODES = ['inform', 'discuss', 'decide'] as const;
/** Tamaño del título: `xl`=`--h1`, `lg`=`--h1-lg`, `md`=`--h1-md`, `sm`=`--h2`. */
export const TITLE_SIZES = ['xl', 'lg', 'md', 'sm'] as const;

/** Una fecha con zona horaria: `2026-11-22T10:00:00-05:00`. Sin zona, la cuenta regresiva depende del equipo. */
export const ISO_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;

export const DECK_VERSION = 1;
