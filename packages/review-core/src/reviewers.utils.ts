import type { ReviewerLabel } from './review.types';

/** "Ana López (La Ceja)"; sin municipio, solo el nombre. */
export function formatReviewerLabel(label: ReviewerLabel | undefined): string {
  if (!label) return 'Alguien';
  return label.municipality
    ? `${label.name} (${label.municipality})`
    : label.name;
}
