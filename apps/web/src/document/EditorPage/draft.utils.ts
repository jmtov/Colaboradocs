import type {
  DocumentContent,
  DocumentSection,
  DocumentSource,
} from '@colaboradocs/review-core';
import type { DocumentDetails } from './components/EditorDetails/EditorDetails.types';
import { type GlossaryLinks, sameLinks } from './glossary.utils';
import { samePeople } from './people.utils';
import { sameSections } from './section.utils';
import { sameSources } from './sources.utils';

/** Lo que el editor lleva como copia de trabajo, ya con el glosario unido a las secciones. */
export type WorkingCopy = {
  details: DocumentDetails;
  sections: DocumentSection[];
  sources: DocumentSource[];
  links: GlossaryLinks;
  people: Record<string, string>;
};

const hasKeys = (value: object) => Object.keys(value).length > 0;

/** Los datos de la tarjeta de un documento (vacíos si todavía no hay documento). */
export function detailsOf(
  doc: DocumentContent | null | undefined,
): DocumentDetails {
  return {
    title: doc?.title ?? '',
    description: doc?.description ?? '',
    type: doc?.type ?? 'other',
    date: doc?.date ?? '',
    owner: doc?.owner ?? '',
    attendees: doc?.attendees ?? '',
  };
}

/** El documento tal como quedaría: lo último guardado con la copia de trabajo encima. */
export function contentFrom(
  base: DocumentContent,
  copy: WorkingCopy,
): DocumentContent {
  // Sin enlaces y sin que los hubiera, el campo no existe (no se agrega un `{}` de la nada).
  const keepLinks = base.glossaryTerms !== undefined || hasKeys(copy.links);
  const keepPeople = base.peopleTerms !== undefined || hasKeys(copy.people);
  const { title, description, type, date, owner, attendees } = copy.details;
  const {
    description: _description,
    type: _type,
    date: _date,
    owner: _owner,
    attendees: _attendees,
    ...rest
  } = base;
  return {
    ...rest,
    title,
    ...(description ? { description } : {}),
    // «otro» es lo de siempre: no se escribe si no estaba.
    ...(type !== 'other' ? { type } : {}),
    ...(date ? { date } : {}),
    ...(owner ? { owner } : {}),
    ...(attendees ? { attendees } : {}),
    sections: copy.sections,
    sources: copy.sources,
    ...(keepLinks ? { glossaryTerms: copy.links } : {}),
    ...(keepPeople ? { peopleTerms: copy.people } : {}),
  };
}

/** La copia de trabajo difiere de lo último guardado. */
export function isDirty(last: DocumentContent, copy: WorkingCopy): boolean {
  const saved = detailsOf(last);
  const now = copy.details;
  return (
    now.title !== saved.title ||
    now.description !== saved.description ||
    now.type !== saved.type ||
    now.date !== saved.date ||
    now.owner !== saved.owner ||
    now.attendees !== saved.attendees ||
    !sameSections(last.sections, copy.sections) ||
    !sameSources(last.sources, copy.sources) ||
    !sameLinks(last.glossaryTerms ?? {}, copy.links) ||
    !samePeople(last.peopleTerms ?? {}, copy.people)
  );
}
