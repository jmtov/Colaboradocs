import type { DocumentKind } from '@colaboradocs/review-core';

const EMPTY_DATE = 'Si la dejas vacía, se usa la de la última versión.';

/** La ayuda de la ficha: para qué sirve la fecha según el tipo (las iniciativas se ordenan por título). */
export const DATE_HINTS: Record<DocumentKind, string> = {
  initiative: `La fecha es la de elaboración; las iniciativas se ordenan por título. ${EMPTY_DATE}`,
  minutes: `La fecha de la reunión ordena las actas. ${EMPTY_DATE}`,
  guide: `La fecha de elaboración ordena las guías. ${EMPTY_DATE}`,
  other: `La fecha de elaboración ordena estos documentos. ${EMPTY_DATE}`,
};
