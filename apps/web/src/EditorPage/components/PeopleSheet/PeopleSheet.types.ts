import type { ReviewerLabel } from '@colaboradocs/review-core';
import type { SheetLayerProps } from '@colaboradocs/review-ui';

/** Resuelve con los nombres elegidos, separados por coma («Ana, Luis»); vacío si no queda nadie. */
export type PeopleSheetProps = SheetLayerProps<string> & {
  /** Sobre la hoja: «Acta», «Iniciativa»… */
  kicker: string;
  title: string;
  /** Una línea de ayuda; se le suma cuántas hay elegidas. */
  hint: string;
  /** Solo una persona (elegir otra reemplaza a la anterior). */
  single?: boolean;
  people: ReviewerLabel[];
  /** Lo que ya hay, como texto: «Ana, Luis». */
  current: string;
  /** Nombres de las personas que el texto del documento menciona. */
  mentioned?: string[];
};
