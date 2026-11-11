import { useReview } from '@juntanza/review-ui';
import { createResource } from 'solid-js';

/** Las versiones del documento; se piden cada vez que se abre la hoja. */
export function useVersionsSheet(options: {
  open: () => boolean;
  documentId: () => string;
}) {
  const review = useReview();
  const [versions] = createResource(
    () => (options.open() ? options.documentId() : false),
    (id) => review.fetchVersions(id),
  );
  return { versions };
}
