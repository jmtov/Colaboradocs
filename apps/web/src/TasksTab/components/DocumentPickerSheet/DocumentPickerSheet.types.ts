import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Un documento que se puede elegir, con cuántas tareas tiene. */
export type PickableDocument = { id: string; title: string; count: number };

export type DocumentPickerSheetProps = SheetLayerProps<string[]> & {
  documents: PickableDocument[];
  /** Los elegidos ahora. */
  selected: string[];
};
