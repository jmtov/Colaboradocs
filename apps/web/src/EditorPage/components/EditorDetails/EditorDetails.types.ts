import type { DocumentKind } from '@colaboradocs/review-core';

/** Los datos de la tarjeta del documento en la home (la descripción vacía no se muestra). */
export type DocumentDetails = {
  title: string;
  description: string;
  /** Clase de documento: la home los agrupa así. */
  tipo: DocumentKind;
  /** Cuándo se elaboró (`AAAA-MM-DD`); en un acta, el día de la reunión. Vacía, vale la de la última versión. */
  date: string;
  /** Quién responde por una iniciativa; vacío, nadie. */
  responsable: string;
  /** Quiénes estuvieron en un acta; vacío, nadie. */
  participantes: string;
};

export type EditorDetailsProps = {
  details: DocumentDetails;
  onChange: (details: DocumentDetails) => void;
  /** Abre la hoja para elegir a quién va en ese campo de personas. */
  onPickPeople: (field: 'responsable' | 'participantes') => void;
};
