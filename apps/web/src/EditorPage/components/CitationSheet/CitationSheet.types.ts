import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { DocumentSource } from '@/content/content.types';

/** Resuelve con los números de las fuentes elegidas (1 = la primera), o sin resultado si se cancela. */
export type CitationSheetProps = SheetLayerProps<number[]> & {
  sources: DocumentSource[];
};
