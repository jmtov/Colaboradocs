import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** El título y la descripción del documento (la descripción es la tarjeta de la home; vacía, no hay). */
export type DocumentDetails = { title: string; description: string };

export type DetailsSheetProps = SheetLayerProps<DocumentDetails> &
  DocumentDetails;
