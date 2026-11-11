import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Lo que se decide en la hoja de una fuente: guardarla con estos datos o quitarla. */
export type SourceResult = { remove: true } | { label: string; url: string };

export type SourceSheetProps = SheetLayerProps<SourceResult> & {
  /** Número en la bibliografía (el que usan las citas «[n]»). */
  number: number;
  label: string;
  url: string;
  isNew: boolean;
  /** Solo la última se puede quitar: las citas son por número. */
  canRemove: boolean;
};
