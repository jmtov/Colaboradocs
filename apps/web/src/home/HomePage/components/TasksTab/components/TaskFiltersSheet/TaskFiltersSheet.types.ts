import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Lo que elige la hoja: los documentos de los que mostrar tareas (vacío, todos). */
export type TaskFilters = { documentIds: string[] };

export type TaskFiltersSheetProps = SheetLayerProps<TaskFilters> & {
  /** Los documentos elegidos ahora. */
  documentIds: string[];
  /** Los documentos que tienen tareas, con cuántas. */
  documents: { id: string; title: string; count: number }[];
};
