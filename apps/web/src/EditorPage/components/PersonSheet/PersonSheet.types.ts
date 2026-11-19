import type { ReviewerLabel } from '@colaboradocs/review-core';
import type { SheetLayerProps } from '@colaboradocs/review-ui';

/**
 * Resuelve con la persona elegida (su nombre registrado) y cómo se escribe en el
 * texto; sin resultado si se cancela.
 */
export type PersonResult = { name: string; text: string };

export type PersonSheetProps = SheetLayerProps<PersonResult> & {
  people: ReviewerLabel[];
};
