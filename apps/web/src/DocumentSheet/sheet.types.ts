/** Qué muestra la hoja del documento. Cerrada no es un estado: la hoja se desmonta. */
export type SheetState =
  | { kind: 'contents' }
  | { kind: 'term'; label: string }
  | { kind: 'person'; name: string }
  | { kind: 'cite'; text: string }
  | { kind: 'section'; sectionNumber: string };
