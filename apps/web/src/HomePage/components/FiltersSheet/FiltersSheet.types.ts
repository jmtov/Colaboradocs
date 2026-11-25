import type { DocumentKind } from '@colaboradocs/review-core';
import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Lo que elige la hoja: el tipo de documento a mostrar (`null`, todos). */
export type DocumentFilters = { kind: DocumentKind | null };

export type FiltersSheetProps = SheetLayerProps<DocumentFilters> & {
  /** El filtro que está aplicado ahora. */
  kind: DocumentKind | null;
  /** Los tipos que hay y cuántos documentos de cada uno. */
  kinds: { kind: DocumentKind; title: string; count: number }[];
};
