import type { SlideStyle, StyleLayer } from '../theme/theme.types';
import type {
  AGENDA_MODES,
  BLOCK_KINDS,
  COLUMN_COUNTS,
  DENSITIES,
  SLIDE_KINDS,
  SLIDE_TONES,
  TITLE_SIZES,
} from './deck.constants';

export type SlideKind = (typeof SLIDE_KINDS)[number];
export type BlockKind = (typeof BLOCK_KINDS)[number];
export type SlideTone = (typeof SLIDE_TONES)[number];
export type TitleSize = (typeof TITLE_SIZES)[number];
export type Span = (typeof COLUMN_COUNTS)[number];
export type Density = (typeof DENSITIES)[number];
export type AgendaMode = (typeof AGENDA_MODES)[number];

/** Nombre de un icono del registro de SVG en línea (`mic`, `clock`, `fork`…). */
export type IconName = string;

/** Quien habla, quien responde o quien aparece en un bloque: un nombre y, si hace falta, un rol o detalle. */
export interface Person {
  name: string;
  role?: string;
}

/**
 * Línea superior de la slide. Solo datos: cómo se ve el modo (etiqueta, icono) y los minutos
 * (reloj) lo decide el tema, no el contenido.
 */
export interface Eyebrow {
  index?: string;
  text?: string;
  minutes?: number;
  mode?: AgendaMode;
}

/** Elemento decorativo registrado por el tema o el deck (croquis de fondo, estrellas…). */
export interface Decor {
  component: string;
  props?: Record<string, unknown>;
}

// ---------- Bloques ----------

export interface ListItem {
  text: string;
  detail?: string;
  icon?: IconName;
}

export interface AgendaItem {
  /** `highlight` destaca el ítem en un cuadro aparte (un descanso, una comida). */
  type?: 'item' | 'highlight';
  time?: string;
  minutes?: number;
  mode?: AgendaMode;
  title: string;
  detail?: string;
  icon?: IconName;
  speaker?: Person;
}

export interface TimelineEvent {
  date: string;
  title: string;
  detail?: string;
  hollow?: boolean;
}

export interface Source {
  label?: string;
  text: string;
}

type BlockShape =
  | {
      kind: 'heading';
      /** Una línea por elemento; cada línea entra con su propia máscara. */
      title: string[];
      /** Si falta: `sm`. */
      titleSize?: TitleSize;
      /** Frase de apoyo bajo el filete. */
      subtitle?: string;
    }
  | { kind: 'note'; text: string }
  | {
      kind: 'list';
      ordered?: boolean;
      /** `lg` por omisión; `md` para listas de pasos o de apoyo. */
      size?: 'lg' | 'md';
      items: ListItem[];
    }
  | {
      kind: 'card';
      title: string;
      kicker?: string;
      text?: string;
      icon?: IconName;
      /** Índice (desde 0) en las categorías del tema: pone el color de la tarjeta. */
      category?: number;
      tone?: SlideTone;
      people?: Person[];
      sources?: Source[];
      footer?: string;
    }
  | { kind: 'person'; person: Person }
  | { kind: 'figure'; value: string; unit?: string; caption?: string }
  | {
      kind: 'image';
      src: string;
      alt: string;
      ratio?: string;
      framed?: boolean;
    }
  | { kind: 'qr'; src: string; alt: string; link: string }
  | { kind: 'countdown'; target: string; label: string }
  | { kind: 'notice'; text: string; icon?: IconName }
  /** Con `columns: 2`, `split` es el índice del primer ítem de la segunda columna (por omisión, la mitad). */
  | { kind: 'agenda'; columns?: 1 | 2; split?: number; items: AgendaItem[] }
  | { kind: 'timeline'; events: TimelineEvent[] }
  | { kind: 'date-box'; day: string; month: string }
  | {
      kind: 'chips';
      items: { text: string; variant?: 'solid' | 'outline' | 'dashed' }[];
    }
  | { kind: 'custom'; component: string; props?: Record<string, unknown> };

/** Un bloque, con las columnas que ocupa si no es de ancho completo (ver `BLOCK_SPAN`). */
export type Block = BlockShape & {
  /** Columna y fila donde empieza (desde 1). Sin las dos, el bloque va a la primera celda libre. */
  col?: number;
  row?: number;
  /** Columnas que ocupa. */
  span?: Span;
  /** Filas que ocupa. */
  rowSpan?: number;
  /** Tarjetas, personas y avisos crecen hasta llenar el alto de sus celdas; `false` los deja del tamaño de su contenido. */
  grow?: boolean;
};

// ---------- Slides ----------

interface SlideBase {
  id?: string;
  eyebrow?: Eyebrow;
  /** Quién dice la slide (una sola persona). Sin esto no se muestra orador. */
  speaker?: Person;
  tone?: SlideTone;
  /** Índice (desde 0) en las categorías del tema: pone `--c` en la slide. */
  category?: number;
  density?: Density;
  decor?: Decor;
  style?: SlideStyle;
  /** Notas para quien presenta; no se dibujan. */
  notes?: string;
}

/**
 * La slide de contenido: bloques en una cuadrícula de `columns` × `rows` celdas. El título es el
 * bloque `heading`, como cualquier otro, pero solo puede haber uno.
 */
export interface ContentSlide extends SlideBase {
  kind: 'content';
  columns?: Span;
  /** Filas de la cuadrícula; por omisión, las que hagan falta. */
  rows?: number;
  body?: Block[];
}

export type Slide = ContentSlide;

// ---------- Deck ----------

export interface EngineOptions {
  /** Muestra el botón de claro/oscuro y la tecla T. */
  themeToggle?: boolean;
  /** Las cuentas regresivas solo se ven si faltan menos de estas horas. */
  countdownMaxHours?: number;
  /** Alto (px) de la franja superior donde aparecen los controles. */
  topZonePx?: number;
  /** Número de página en el PDF, en lugar del contador de pantalla. */
  printPageNumbers?: boolean;
}

export interface Deck {
  version: number;
  id: string;
  title: string;
  lang: string;
  /** Id del tema (la organización). */
  theme: string;
  /** Id de una variante del tema (el evento). */
  variant?: string;
  style?: StyleLayer;
  engine?: EngineOptions;
  slides: Slide[];
}
