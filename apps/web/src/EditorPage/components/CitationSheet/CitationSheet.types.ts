import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { DocumentSource } from '@/content/content.types';

/** Resuelve con los números de las fuentes elegidas (1 = la primera), o sin resultado si se cancela. */
export type CitationSheetProps = SheetLayerProps<number[]> & {
  sources: DocumentSource[];
  /** Las fuentes que ya tiene la cita, si se está editando una (vacío al insertar una nueva). */
  selected?: number[];
  /** Si la cita que se edita trae algo más que números (etiquetas, «princ. 2»): se pierde al aplicar. */
  note?: string;
};
