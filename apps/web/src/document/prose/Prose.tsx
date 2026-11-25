import type { DocumentSection } from '@colaboradocs/review-core';
import { buildProse } from './buildProse';

type Props = {
  section: DocumentSection;
  /** Contenido principal (revisable y con enlaces) o copia de solo lectura. */
  reviewable: boolean;
  glossaryTerms?: Record<string, string>;
  peopleTerms?: Record<string, string>;
};

export default function Prose(props: Props) {
  return buildProse(props.section.html, {
    sectionId: props.section.id,
    reviewable: props.reviewable,
    glossaryTerms: props.glossaryTerms,
    peopleTerms: props.peopleTerms,
  });
}
