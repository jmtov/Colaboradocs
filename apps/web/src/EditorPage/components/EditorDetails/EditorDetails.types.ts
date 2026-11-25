import type { DocumentKind } from '@colaboradocs/review-core';

/** Los datos de la tarjeta del documento en la home (la descripción vacía no se muestra). */
export type DocumentDetails = {
  title: string;
  description: string;
  /** Clase de documento: la home los agrupa así. */
  type: DocumentKind;
  /** Cuándo se elaboró (`AAAA-MM-DD`); en un acta, el día de la reunión. Vacía, vale la de la última versión. */
  date: string;
  /** Quién responde por una iniciativa; vacío, nadie. */
  owner: string;
  /** Quiénes estuvieron en un acta; vacío, nadie. */
  attendees: string;
};

export type EditorDetailsProps = {
  details: DocumentDetails;
  onChange: (details: DocumentDetails) => void;
  /** Abre la hoja para elegir a quién va en ese campo de personas. */
  onPickPeople: (field: 'owner' | 'attendees') => void;
};
