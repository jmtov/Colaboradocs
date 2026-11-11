import type { DocumentVersionItem } from '@colaboradocs/review-core';
import { formatReviewerLabel } from '@colaboradocs/review-core';

const formatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

/** «Publicada el 10 nov 2026 · Ana (Rionegro)» o «Reemplazada el…». */
export function describeVersion(item: DocumentVersionItem): string {
  const date = new Date(item.at);
  const when = Number.isNaN(date.getTime()) ? '' : formatter.format(date);
  const action = item.current ? 'Publicada' : 'Reemplazada';
  const by = item.by ? ` · ${formatReviewerLabel(item.by)}` : '';
  return `${action}${when ? ` el ${when}` : ''}${by}`;
}
