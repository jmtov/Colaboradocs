import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Lo que se decide en la hoja de un término: guardarlo con estos datos o quitarlo. */
export type TermResult =
  | { remove: true }
  | { term: string; definition: string; forms: string };

export type TermSheetProps = SheetLayerProps<TermResult> & {
  /** Vacío si el término es nuevo. */
  term: string;
  definition: string;
  /** Cómo aparece en el texto, separado por comas. */
  forms: string;
  isNew: boolean;
};
