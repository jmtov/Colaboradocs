export type SheetState =
  | { kind: 'none' }
  | { kind: 'contents' }
  | { kind: 'term'; label: string }
  | { kind: 'cite'; text: string }
  | { kind: 'section'; sectionNumber: string };
