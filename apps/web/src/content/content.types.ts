export type SectionStatus = 'listo' | 'borrador' | 'pendiente';

export type DocumentSection = {
  id: string;
  /** "1", "2"… para las secciones; "A", "B" para los anexos. */
  num: string;
  title: string;
  status: SectionStatus;
  /** Una línea para la tarjeta del inicio (opcional). */
  description?: string;
  /** HTML limitado: p, ul, ol, li, strong, em, br, h3, dl, dt, dd. */
  html: string;
};

export type DocumentSource = {
  label: string;
  url: string;
};

export type DocumentContent = {
  /** Id del documento en el backend de revisión. Cambiarlo = empezar sin comentarios. */
  id: string;
  title: string;
  /** Nombre corto para el encabezado ("Principios /"). Por defecto, el título. */
  shortName?: string;
  /** Línea sobre el título del inicio. `{version}` se reemplaza por la versión. */
  eyebrow?: string;
  /** Párrafo bajo el título del inicio. */
  lead?: string;
  version: string;
  updated: string;
  /**
   * Cómo se llama y se muestra el rol de cada persona (campo `municipality`).
   * `format` usa `{value}`: «Representante {value}». Por defecto, «Rol» tal cual.
   */
  roleField?: { label: string; format?: string };
  /** Segundo botón del inicio, que salta a una sección. Sin esto, no hay botón. */
  highlightSection?: { id: string; label: string };
  /**
   * Cómo se escribe un término en el texto (minúsculas) -> su entrada en la
   * sección `glosario`. Opcional: sin esto no se enlaza nada.
   */
  glossaryTerms?: Record<string, string>;
  sources: DocumentSource[];
  sections: DocumentSection[];
};
