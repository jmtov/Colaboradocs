import { useReview } from '@colaboradocs/review-ui';
import { createResource } from 'solid-js';

/** Las versiones del documento. La hoja se monta al abrirse, así que se piden al montarse. */
export function useVersionsSheet(options: { documentId: () => string }) {
  const review = useReview();
  const [versions] = createResource(
    () => options.documentId(),
    (id) => review.fetchVersions(id),
  );
  return { versions };
}
